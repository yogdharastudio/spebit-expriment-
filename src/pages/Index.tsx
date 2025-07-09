import { Button } from "@/components/ui/button";
import { ChevronDown, TrendingUp, Shield, Smartphone, BarChart3, DollarSign, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tradingInterface from "@/assets/trading-interface.jpg";
import cryptoTrading from "@/assets/crypto-trading.jpg";
import portfolioManagement from "@/assets/portfolio-management.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Promo Banner */}
      <div className="bg-zinc-900 text-center py-2 text-sm">
        Crypto buy limited-time offers. 
        <button className="text-green-400 underline ml-1"></button>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black border-b border-zinc-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/d6b36037-7c49-4f49-98f6-d7eb957417d4.png" 
                alt="Spebit Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">Spebit</span>
            </div>
            
            <div className="hidden lg:flex items-center gap-8">
              <button className="text-white hover:text-green-400 transition-colors flex items-center gap-1">
                <ChevronDown className="h-4 w-4" />
              </button>
              <a href="#" className="text-white hover:text-green-400 transition-colors"></a>
              <a href="#" className="text-white hover:text-green-400 transition-colors"></a>
              <a href="#" className="text-white hover:text-green-400 transition-colors"></a>
              <a href="#" className="text-white hover:text-green-400 transition-colors"></a>
              <a href="#" className="text-white hover:text-green-400 transition-colors"></a>
            </div>

            <div className="flex items-center gap-3">
              <button className="text-white hover:text-green-400 transition-colors flex items-center gap-1">
                <ChevronDown className="h-4 w-4" />
              </button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/auth")}
                className="text-white border border-green-400 rounded-full px-6 hover:bg-green-400 hover:text-black"
              >
                Log in
              </Button>
              <Button 
                variant="robinhood"
                onClick={() => navigate("/auth")}
                className="bg-green-400 text-black hover:bg-green-500"
              >
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="absolute inset-0 robinhood-particles"></div>
        <div className="absolute inset-0 robinhood-dome"></div>
        <div className="absolute inset-0 floating-particles"></div>
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-6xl md:text-8xl font-bold mb-8 leading-tight animate-fade-up text-glow">
              Join millions who trust Spebit
              <br />
              buy crypto
                No Tex No Fee No KYC
            </h3>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto animate-scale-in" style={{ animationDelay: '0.3s' }}>
              Spebit is now available in 30+ countries. Learn about the updates 
              MOST POPULER WEBSITE BUY CRYPTO CURRENCY
            </p>
            
            <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <Button 
                variant="robinhood"
                onClick={() => navigate("/auth")}
                className="bg-green-400 text-black hover:bg-green-500 text-lg px-8 py-4 robinhood-glow hover-lift"
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trading Tools Section */}
      <section className="py-24 bg-zinc-900">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 animate-fade-up">
              <div className="bg-gray-800 rounded-2xl p-8 h-96 flex items-center justify-center hover-lift robinhood-glow">
                <img 
                  src={tradingInterface}
                  alt="Trading Interface" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 animate-slide-up">
              <div className="text-green-400 font-semibold mb-4 text-glow">Intuitive trading tools</div>
              <h2 className="text-4xl md:text-5xl font-light mb-6 leading-tight">
                Build your strategy and track buy crypto, no extra charge
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                buy crypto, options, crypto, and more on Spebit Legend and the Spebit website and app.
              </p>
              <Button 
                variant="robinhood"
                className="bg-green-400 text-black hover:bg-green-500 hover-lift robinhood-glow"
              >
                Learn more
              </Button>
              <p className="text-xs text-gray-500 mt-6">
                Stocks & funds buy offered through Spebit Financial. Crypto offered through Spebit Crypto. 
                See our Fee Schedule for more details contect me.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Crypto Section */}
       <section className="py-24 bg-zinc-900 dark:bg-zinc-900 relative floating-particles">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-light mb-6 leading-tight">
                Get started with 
                <span className="text-green-400 text-glow"> Spebit Crypto</span>
                <br />
                buy crypto 24/7
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Start with as little as minimum. Buy, and transfer BTC, ETH, XRP, SOL, DOGE, SHIB, and more.
              </p>
              <Button 
                variant="robinhood"
                className="bg-green-400 text-black hover:bg-green-500 mb-4 hover-lift robinhood-glow"
              >
                Learn more
              </Button>
              <p className="text-xs text-gray-500">
                Crypto offered through Spebit Crypto.
              </p>
            </div>
            <div className="animate-scale-in">
              <div className="bg-zinc-400 rounded-2xl p-8 h-96 flex items-center justify-center hover-lift robinhood-glow">
                <img 
                  src={cryptoTrading}
                  alt="Crypto Trading" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Portfolio Section */}
      <section className="py-24 bg-zinc-900">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 animate-scale-in">
              <div className="bg-gray-800 rounded-2xl p-8 h-96 flex items-center justify-center hover-lift robinhood-glow">
                <img 
                  src={portfolioManagement}
                  alt="Portfolio Management" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-light mb-6 leading-tight">
                Your portfolio, handled by the pros
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Let our experts manage your investments with professionally built portfolios and automated rebalancing.
              </p>
              <Button 
                variant="robinhood"
                className="bg-green-400 text-black hover:bg-green-500 hover-lift robinhood-glow"
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light mb-6">
              Everything you need to invest
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-8 animate-fade-up hover-lift" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-400/10 rounded-full flex items-center justify-center robinhood-glow">
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Commission-free trading</h3>
              <p className="text-gray-400">
                Buy stocks, ETFs, and crypto with zero commission fees.
              </p>
            </div>

            <div className="text-center p-8 animate-fade-up hover-lift" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-400/10 rounded-full flex items-center justify-center robinhood-glow">
                <Smartphone className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Mobile-first design</h3>
              <p className="text-gray-400">
                share with friend and earn 2 doller
              </p>
            </div>

            <div className="text-center p-8 animate-fade-up hover-lift" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-400/10 rounded-full flex items-center justify-center robinhood-glow">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Security first</h3>
              <p className="text-gray-400">
                meximum amount deposit 10000000, zero fee
              </p>
            </div>

            <div className="text-center p-8 animate-fade-up hover-lift" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-400/10 rounded-full flex items-center justify-center robinhood-glow">
                <BarChart3 className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Advanced analytics</h3>
              <p className="text-gray-400">
                Get insights with real-time market data and research tools.
              </p>
            </div>

            <div className="text-center p-8 animate-fade-up hover-lift" style={{ animationDelay: '0.5s' }}>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-400/10 rounded-full flex items-center justify-center robinhood-glow">
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart investing</h3>
              <p className="text-gray-400">
                buy crypto low price injoy user
              </p>
            </div>

            <div className="text-center p-8 animate-fade-up hover-lift" style={{ animationDelay: '0.6s' }}>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-400/10 rounded-full flex items-center justify-center robinhood-glow">
                <Zap className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Lightning fast</h3>
              <p className="text-gray-400">
                Execute buy instantly with our high-speed infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-zinc-900">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-light mb-6">
              Ready to start investing?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join millions who trust Spebit for commission-free investing.
            </p>
            <Button 
              variant="robinhood"
              onClick={() => navigate("/auth")}
              className="bg-green-400 text-black hover:bg-green-500 text-lg px-12 py-4 hover-lift robinhood-glow animate-scale-in"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 bg-black">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src="/lovable-uploads/d6b36037-7c49-4f49-98f6-d7eb957417d4.png" 
                  alt="Spebit Logo" 
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold">Spebit</span>
              </div>
              <p className="text-gray-400 text-sm">
                Commission-free investing, plus the tools you need to put your money in motion.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Investing</a></li>
                <li><a href="#" className="hover:text-white">Retirement</a></li>
                <li><a href="#" className="hover:text-white">Crypto</a></li>
                <li><a href="#" className="hover:text-white">Spending</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-zinc-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 Spebit. All rights reserved.
              </div>
              <div className="flex gap-6 text-gray-400 text-sm">
                <a href="#" className="hover:text-white">Privacy</a>
                <a href="#" className="hover:text-white">Terms</a>
                <a href="#" className="hover:text-white">Disclosure Library</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
