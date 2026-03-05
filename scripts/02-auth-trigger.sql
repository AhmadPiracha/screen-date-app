-- Create trigger to automatically create user profile when auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert into users table, ignore if already exists
  insert into public.users (id, created_at, updated_at)
  values (
    new.id,
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Log error but don't fail the auth signup
    raise warning 'Error creating user profile: %', SQLERRM;
    return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger to run when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
