-- Add payment methods table for admin to configure
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add enhanced fields to user_transactions table
ALTER TABLE public.user_transactions 
ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id),
ADD COLUMN payment_screenshot_url TEXT,
ADD COLUMN blockchain_network TEXT,
ADD COLUMN receive_address TEXT,
ADD COLUMN rupee_amount DECIMAL(20,2),
ADD COLUMN admin_notes TEXT;

-- Update transaction status enum to include more states
ALTER TABLE public.user_transactions 
DROP CONSTRAINT user_transactions_status_check;

ALTER TABLE public.user_transactions 
ADD CONSTRAINT user_transactions_status_check 
CHECK (status IN ('pending', 'payment_uploaded', 'blockchain_submitted', 'approved', 'rejected', 'completed'));

-- Enable RLS for payment methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Payment methods policies (everyone can view)
CREATE POLICY "Anyone can view active payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (is_active = true);

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false);

-- Create policies for payment screenshots
CREATE POLICY "Users can upload payment screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own payment screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for admins to view all payment screenshots (will need admin role system later)
CREATE POLICY "Authenticated users can view payment screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-screenshots');

-- Add trigger for payment methods updated_at
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment methods
INSERT INTO public.payment_methods (name, icon_url) VALUES
('Google Pay', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png'),
('PhonePe', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png'),
('UPI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/512px-UPI-Logo-vector.svg.png'),
('Mobikwik', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/MobiKwik_logo.svg/512px-MobiKwik_logo.svg.png'),
('PayPal', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/512px-PayPal.svg.png');