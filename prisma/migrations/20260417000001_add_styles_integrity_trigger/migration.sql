CREATE OR REPLACE FUNCTION validate_styles_array() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM unnest(NEW.styles) s
    WHERE s NOT IN (SELECT name FROM dance_styles)
  ) THEN
    RAISE EXCEPTION 'Invalid dance style in styles array: %', NEW.styles;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER check_event_card_styles
  BEFORE INSERT OR UPDATE ON event_cards
  FOR EACH ROW EXECUTE FUNCTION validate_styles_array();

CREATE OR REPLACE TRIGGER check_section_card_styles
  BEFORE INSERT OR UPDATE ON section_cards
  FOR EACH ROW EXECUTE FUNCTION validate_styles_array();
