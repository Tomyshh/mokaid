defmodule Mokaid.Repo.Migrations.RetireBusinessEnterprisePlans do
  use Ecto.Migration

  # Business/Enterprise are retired; the office caps at 9 desks → Professional.
  # Purchased credit packs are kept. Included monthly balances are capped at
  # Professional's 20_000 grant.

  def up do
    execute("""
    WITH professional AS (
      SELECT id FROM billing_plans WHERE key = 'professional' LIMIT 1
    ),
    obsolete AS (
      SELECT id FROM billing_plans WHERE key IN ('business', 'enterprise')
    )
    UPDATE subscriptions AS s
    SET
      plan_id = (SELECT id FROM professional),
      monthly_credits = 20000,
      included_credits_remaining = LEAST(
        COALESCE(s.included_credits_remaining, 0),
        20000
      ),
      updated_at = NOW()
    WHERE s.plan_id IN (SELECT id FROM obsolete)
      AND EXISTS (SELECT 1 FROM professional)
    """)

    execute("""
    DELETE FROM billing_plans
    WHERE key IN ('business', 'enterprise')
    """)

    execute("""
    UPDATE billing_plans
    SET
      limits = jsonb_set(COALESCE(limits, '{}'::jsonb), '{agents}', '9'::jsonb, true),
      features = ARRAY[
        '9 AI employees (full office)',
        '20,000 AI credits / month',
        'All MCP integrations',
        'GitHub & Figma, deployment',
        'Team collaboration',
        'Auto-recharge available'
      ],
      updated_at = NOW()
    WHERE key = 'professional'
    """)
  end

  def down do
    # Re-insert retired plans for rollback; leave migrated subscriptions on Professional.
    execute("""
    INSERT INTO billing_plans (
      id, key, name, price_cents_monthly, price_cents_yearly, limits, features,
      inserted_at, updated_at
    )
    VALUES
      (
        gen_random_uuid(),
        'business',
        'Business',
        39900,
        399000,
        '{"agents": 30, "credits_monthly": 60000, "mcp_integrations": -1}'::jsonb,
        ARRAY[
          '30 AI employees',
          '60,000 AI credits / month',
          'Full AI team & API access',
          'Execution priority',
          'Priority support',
          'Auto-recharge available'
        ],
        NOW(),
        NOW()
      ),
      (
        gen_random_uuid(),
        'enterprise',
        'Enterprise',
        0,
        0,
        '{"agents": -1, "credits_monthly": -1, "mcp_integrations": -1}'::jsonb,
        ARRAY[
          'Unlimited AI employees',
          'Unlimited AI credits',
          'SSO & private deployment',
          'SLA & custom models',
          'Dedicated support'
        ],
        NOW(),
        NOW()
      )
    ON CONFLICT (key) DO NOTHING
    """)

    execute("""
    UPDATE billing_plans
    SET
      limits = jsonb_set(COALESCE(limits, '{}'::jsonb), '{agents}', '10'::jsonb, true),
      features = ARRAY[
        '10 AI employees',
        '20,000 AI credits / month',
        'All MCP integrations',
        'GitHub & Figma, deployment',
        'Team collaboration',
        'Auto-recharge available'
      ],
      updated_at = NOW()
    WHERE key = 'professional'
    """)
  end
end
