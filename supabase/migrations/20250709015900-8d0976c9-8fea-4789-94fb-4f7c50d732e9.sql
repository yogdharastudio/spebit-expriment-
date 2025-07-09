-- Add admin role to spebit.com@gmail.com user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('1bd3dde2-285b-497f-9135-6253104501a4', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure user profile exists
INSERT INTO public.user_profiles (user_id, full_name, is_blocked) 
VALUES ('1bd3dde2-285b-497f-9135-6253104501a4', 'Spebit Admin', false)
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  is_blocked = EXCLUDED.is_blocked;