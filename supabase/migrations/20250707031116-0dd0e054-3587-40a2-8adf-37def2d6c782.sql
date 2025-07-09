-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user profiles table with additional fields
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  mobile_number TEXT,
  plain_password TEXT, -- WARNING: Security risk - storing unhashed passwords
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  referral_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_profiles
CREATE POLICY "Admin can view all profiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.user_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update all profiles" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Admin can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Allow admin to manage cryptocurrencies
CREATE POLICY "Admin can manage cryptocurrencies" 
ON public.cryptocurrencies 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to manage payment methods
CREATE POLICY "Admin can manage payment methods" 
ON public.payment_methods 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to view all transactions
CREATE POLICY "Admin can view all transactions" 
ON public.user_transactions 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update all transactions" 
ON public.user_transactions 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to view all wallets
CREATE POLICY "Admin can view all wallets" 
ON public.user_wallets 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update all wallets" 
ON public.user_wallets 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default admin user (you'll need to create this user first in Supabase Auth)
-- Replace 'admin@example.com' with your actual admin email
-- You'll need to sign up with this email first, then run:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ((SELECT id FROM auth.users WHERE email = 'admin@example.com'), 'admin');