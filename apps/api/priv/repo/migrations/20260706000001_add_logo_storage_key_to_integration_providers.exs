defmodule Mokaid.Repo.Migrations.AddLogoStorageKeyToIntegrationProviders do
  use Ecto.Migration

  def change do
    alter table(:integration_providers) do
      add :logo_storage_key, :string
    end
  end
end
