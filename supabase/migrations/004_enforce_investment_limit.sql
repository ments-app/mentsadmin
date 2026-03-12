-- Trigger function to enforce max investment per startup/stall
CREATE OR REPLACE FUNCTION public.check_investment_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_max_limit bigint;
  v_current_total bigint;
BEGIN
  -- Get the max limit from the events table
  SELECT max_investment_per_startup INTO v_max_limit
  FROM public.events
  WHERE id = NEW.event_id;

  -- Default to 100,000 if not set or null (safety)
  IF v_max_limit IS NULL THEN
    v_max_limit := 100000;
  END IF;

  -- Calculate current total investment by this user in this stall
  SELECT COALESCE(SUM(amount), 0) INTO v_current_total
  FROM public.event_investments
  WHERE event_id = NEW.event_id
    AND stall_id = NEW.stall_id
    AND investor_id = NEW.investor_id;

  -- Check if new investment exceeds the limit
  IF (v_current_total + NEW.amount) > v_max_limit THEN
    RAISE EXCEPTION 'Investment limit exceeded. Maximum allowed per startup is %', v_max_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_check_investment_limit ON public.event_investments;
CREATE TRIGGER trg_check_investment_limit
BEFORE INSERT ON public.event_investments
FOR EACH ROW
EXECUTE FUNCTION public.check_investment_limit();
