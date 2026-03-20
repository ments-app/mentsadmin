-- Mail Boxes: groups/lists of emails owned by a user
CREATE TABLE mail_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_role TEXT NOT NULL CHECK (owner_role IN ('facilitator', 'startup')),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mail_boxes_owner ON mail_boxes(owner_id);

-- Emails belonging to a box
CREATE TABLE mail_box_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES mail_boxes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(box_id, email)
);

CREATE INDEX idx_mail_box_emails_box ON mail_box_emails(box_id);

-- Campaigns: record of sent emails
CREATE TABLE mail_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('facilitator', 'startup')),
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  box_ids UUID[] NOT NULL,
  recipient_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'partial')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mail_campaigns_sender ON mail_campaigns(sender_id);

-- RLS Policies
ALTER TABLE mail_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_box_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own mail boxes"
  ON mail_boxes FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Users can manage emails in their own boxes"
  ON mail_box_emails FOR ALL
  USING (box_id IN (SELECT id FROM mail_boxes WHERE owner_id = auth.uid()));

CREATE POLICY "Users can view their own campaigns"
  ON mail_campaigns FOR ALL
  USING (sender_id = auth.uid());
