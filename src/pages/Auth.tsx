import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import countries from "world-countries";

// Form schemas (Confirm Password हटाया गया)
const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  countryCode: z.string().min(1, "Please select a country code"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      toast({
        title: "Referral Code Applied!",
        description: `You'll get benefits when you sign up with code: ${refCode}`,
      });
    }
  }, [toast]);

  // Country codes data
  const countryCodes = countries.map(country => ({
    code: country.cca2,
    name: country.name.common,
    callingCode: country.idd?.root ? `${country.idd.root}${country.idd.suffixes?.[0] || ''}` : '',
    flag: country.flag
  })).filter(country => country.callingCode).sort((a, b) => a.name.localeCompare(b.name));

  // Forms
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      countryCode: "",
      mobileNumber: "",
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast({
          title: "Success!",
          description: "Successfully logged in to Spebit",
        });
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: data.fullName,
            mobile_number: data.mobileNumber,
            country_code: data.countryCode,
            referral_code: referralCode || null,
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please login instead.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        // If there's a referral code, create the referral relationship
        if (referralCode && authData.user) {
          try {
            // Find the referrer by referral code
            const { data: referrer } = await supabase
              .from('referrals')
              .select('referrer_id')
              .eq('referral_code', referralCode)
              .single();

            if (referrer) {
              // Create referral relationship
              await supabase
                .from('referrals')
                .insert({
                  referrer_id: referrer.referrer_id,
                  referred_id: authData.user.id,
                  referral_code: referralCode
                });
            }
          } catch (refError) {
            console.error('Error processing referral:', refError);
          }
        }

        setUserEmail(data.email);
        setShowOtpPopup(true);
        toast({
          title: "Check your email!",
          description: "We've sent you a verification link to complete your signup.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please check your credentials.",
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email not verified",
            description: "Please check your email and click the verification link first.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Reset link sent!",
        description: "Check your email for the password reset link.",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col auth-background">
      {/* Navigation */}
      <nav className="border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white" // <-- यहाँ text-white क्लास जोड़ दी
            >
              <ArrowLeft className="h-4 w-4 text-white" /> {/* <-- यहाँ भी text-white */}
              Back to Home
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/d6b36037-7c49-4f49-98f6-d7eb957417d4.png" 
              alt="Spebit Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-white">Spebit</span> {/* <-- यहाँ भी text-white */}
          </div>
        </div>
      </nav>
       
      {/* Auth Form */}
      <div className="flex-1 flex items-start justify-center p-2 pt-6 sm:pt-20">
        <div className="w-full max-w-md">
          {!showForgotPassword ? (
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="login">Login</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signup">
                <Card className="shadow-elegant bg-[#18181b]/90">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-white">Join Spebit</CardTitle>
                    <CardDescription className="text-gray-300">
                      Create your account to start buy crypto 
                      {referralCode && (
                        <div className="mt-2 p-2 bg-green-900/20 text-green-400 rounded text-sm">
                          🎁 Referral code applied: {referralCode}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-3">
                        <FormField
                          control={signupForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Full Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your full name" 
                                  {...field} 
                                  className="bg-[#232323] text-white placeholder:text-gray-400 py-2 px-3 text-base sm:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Enter your email" 
                                  {...field} 
                                  className="bg-[#232323] text-white placeholder:text-gray-400 py-2 px-3 text-base sm:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Create a strong password" 
                                  {...field} 
                                  className="bg-[#232323] text-white placeholder:text-gray-400 py-2 px-3 text-base sm:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* ===== CountryCode Select Dark ===== */}
                        <FormField
                          control={signupForm.control}
                          name="countryCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Country Code</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-[#232323] text-white py-2 px-3 text-base sm:text-sm">
                                    <SelectValue placeholder="Select country code" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[#232323] text-white max-h-60 max-w-xs overflow-auto z-50">
                                  {countryCodes.map((country) => (
                                    <SelectItem 
                                      key={country.code} 
                                      value={country.callingCode} 
                                      className="hover:bg-[#363636] text-base sm:text-sm text-wrap"
                                    >
                                      <span className="inline-block max-w-[180px] truncate align-middle">
                                        {country.flag} {country.name} ({country.callingCode})
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="mobileNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Mobile Number</FormLabel>
                              <FormControl>
                                <Input 
                                  type="tel" 
                                  placeholder="Enter your mobile number" 
                                  {...field} 
                                  className="bg-[#232323] text-white placeholder:text-gray-400 py-2 px-3 text-base sm:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full py-2 text-base sm:text-sm"
                          variant="robinhood"
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating Account..." : "Sign Up"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="login">
                <Card className="shadow-elegant bg-[#18181b]/90">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-gray-300">
                      Sign in to your Spebit account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-3">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Enter your email" 
                                  {...field} 
                                  className="bg-[#232323] text-white placeholder:text-gray-400 py-2 px-3 text-base sm:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Enter your password" 
                                  {...field} 
                                  className="bg-[#232323] text-white placeholder:text-gray-400 py-2 px-3 text-base sm:text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-center justify-between">
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 font-normal text-primary"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full py-2 text-base sm:text-sm"
                          variant="robinhood"
                          disabled={isLoading}
                        >
                          {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="shadow-elegant bg-[#18181b]/90">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Reset Password</CardTitle>
                <CardDescription className="text-gray-300">
                  Enter your email to receive a password reset link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-3">
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              {...field} 
                              className="bg-[#232323] text-white placeholder:text-gray-400 py-2 px-3 text-base sm:text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Back to Login
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        variant="robinhood"
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* OTP Sent Popup */}
      <Dialog open={showOtpPopup} onOpenChange={setShowOtpPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">Email Verification Sent!</DialogTitle>
            <DialogDescription className="text-center">
              We've sent a verification link to <strong>{userEmail}</strong>. 
              Please check your email and click the link to complete your registration.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button variant="robinhood" onClick={() => setShowOtpPopup(false)}>
              Got it!
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
