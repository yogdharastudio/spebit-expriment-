-- Add payment method details columns to payment_methods table
ALTER TABLE public.payment_methods 
ADD COLUMN upi_id TEXT,
ADD COLUMN email_id TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN account_holder_name TEXT,
ADD COLUMN account_number TEXT,
ADD COLUMN ifsc_code TEXT,
ADD COLUMN payment_details JSONB;

-- Update existing payment methods with sample details
UPDATE public.payment_methods 
SET upi_id = 'admin@googlepay' 
WHERE name = 'Google Pay';

UPDATE public.payment_methods 
SET upi_id = 'admin@phonepe' 
WHERE name = 'PhonePe';

UPDATE public.payment_methods 
SET upi_id = 'admin@upi' 
WHERE name = 'UPI';

UPDATE public.payment_methods 
SET upi_id = 'admin@mobikwik' 
WHERE name = 'Mobikwik';

UPDATE public.payment_methods 
SET email_id = 'admin@paypal.com' 
WHERE name = 'PayPal';

UPDATE public.payment_methods 
SET account_holder_name = 'Admin Name',
    bank_name = 'State Bank of India',
    account_number = '1234567890123456',
    ifsc_code = 'SBIN0001234'
WHERE name = 'Bank Transfer';