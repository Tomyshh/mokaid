defmodule Mokaid.Repo.Migrations.AddBillingPaymentFields do
  use Ecto.Migration

  def change do
    alter table(:subscriptions) do
      # AI credits (overage packs) — spendable balance on top of plan quotas.
      add :credits_balance, :integer, null: false, default: 0
    end

    alter table(:invoices) do
      # "subscription" (plan purchase/renewal) or "credits" (AI credit pack).
      add :kind, :string, null: false, default: "subscription"
      # PayMe sale id — set when a hosted checkout is opened for this invoice.
      add :external_payment_id, :string
    end

    create index(:invoices, [:external_payment_id])
  end
end
