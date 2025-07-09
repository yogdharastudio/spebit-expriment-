-- Create cryptocurrencies table for admin to manage prices
CREATE TABLE public.cryptocurrencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  current_price DECIMAL(20,8) NOT NULL DEFAULT 0,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_wallets table for storing user wallet data
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance DECIMAL(20,8) NOT NULL DEFAULT 0,
  referral_earnings DECIMAL(20,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_transactions table for buy history
CREATE TABLE public.user_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crypto_id UUID NOT NULL REFERENCES public.cryptocurrencies(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  amount DECIMAL(20,8) NOT NULL,
  price_per_unit DECIMAL(20,8) NOT NULL,
  total_amount DECIMAL(20,8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  earnings DECIMAL(20,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cryptocurrencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for cryptocurrencies (everyone can read, only admin can modify)
CREATE POLICY "Anyone can view cryptocurrencies" 
ON public.cryptocurrencies 
FOR SELECT 
USING (true);

-- Create policies for user wallets
CREATE POLICY "Users can view their own wallet" 
ON public.user_wallets 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own wallet" 
ON public.user_wallets 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own wallet" 
ON public.user_wallets 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Create policies for user transactions
CREATE POLICY "Users can view their own transactions" 
ON public.user_transactions 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own transactions" 
ON public.user_transactions 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Create policies for referrals
CREATE POLICY "Users can view their referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid()::text = referrer_id::text OR auth.uid()::text = referred_id::text);

CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid()::text = referrer_id::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_cryptocurrencies_updated_at
    BEFORE UPDATE ON public.cryptocurrencies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial cryptocurrencies data
INSERT INTO public.cryptocurrencies (symbol, name, current_price, logo_url) VALUES
('BTC', 'Bitcoin', 45000.00, 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'),
('ETH', 'Ethereum', 2800.00, 'https://cryptologos.cc/logos/ethereum-eth-logo.png'),
('USDT', 'Tether', 1.00, 'https://cryptologos.cc/logos/tether-usdt-logo.png'),
('TRX', 'TRON', 0.08, 'https://cryptologos.cc/logos/tron-trx-logo.png'),
('DOGE', 'Dogecoin', 0.15, 'https://cryptologos.cc/logos/dogecoin-doge-logo.png'),
('TON', 'Toncoin', 2.50, 'https://cryptologos.cc/logos/toncoin-ton-logo.png'),
('SOL', 'Solana', 95.00, 'https://cryptologos.cc/logos/solana-sol-logo.png'),
('NOT', 'Notcoin', 0.012, 'https://cryptologos.cc/logos/notcoin-not-logo.png'),
('BNB', 'Binance Coin', 320.00, 'https://cryptologos.cc/logos/bnb-bnb-logo.png'),
('XRP', 'Ripple', 0.55, 'https://cryptologos.cc/logos/xrp-xrp-logo.png'),
('ADA', 'Cardano', 0.45, 'https://cryptologos.cc/logos/cardano-ada-logo.png'),
('MATIC', 'Polygon', 0.85, 'https://cryptologos.cc/logos/polygon-matic-logo.png'),
('DOT', 'Polkadot', 6.50, 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png'),
('SHIB', 'Shiba Inu', 0.000025, 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png'),
('AVAX', 'Avalanche', 28.00, 'https://cryptologos.cc/logos/avalanche-avax-logo.png'),
('LINK', 'Chainlink', 12.50, 'https://cryptologos.cc/logos/chainlink-link-logo.png'),
('LTC', 'Litecoin', 75.00, 'https://cryptologos.cc/logos/litecoin-ltc-logo.png'),
('UNI', 'Uniswap', 7.20, 'https://cryptologos.cc/logos/uniswap-uni-logo.png'),
('ATOM', 'Cosmos', 8.90, 'https://cryptologos.cc/logos/cosmos-atom-logo.png'),
('XLM', 'Stellar', 0.12, 'https://cryptologos.cc/logos/stellar-xlm-logo.png');