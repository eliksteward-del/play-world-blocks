
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('user', 'super', 'dev');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL DEFAULT 'Player' || floor(random() * 999999)::text,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
    AND (expires_at IS NULL OR expires_at > now())
  )
$$;

CREATE POLICY "Anyone can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Devs can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Game lobbies
CREATE TABLE public.lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game_mode TEXT NOT NULL DEFAULT 'sandbox',
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_players INT NOT NULL DEFAULT 10,
  current_players INT NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  party_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public lobbies" ON public.lobbies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create lobbies" ON public.lobbies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own lobby" ON public.lobbies
  FOR UPDATE TO authenticated USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own lobby" ON public.lobbies
  FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- Code blocks for lobbies
CREATE TABLE public.code_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Script',
  code TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.code_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lobby members can view code" ON public.code_blocks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authors can manage own code" ON public.code_blocks
  FOR ALL TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Devs can manage all code" ON public.code_blocks
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'dev'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, 'Player' || floor(random() * 999999)::text);

  -- First user gets dev rank
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'dev');
    -- Dev also gets permanent super rank
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for lobbies
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobbies;
