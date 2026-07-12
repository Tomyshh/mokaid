defmodule Mokaid.Repo.Migrations.CreateAsset3dTable do
  use Ecto.Migration

  def change do
    create table(:asset_3d, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, null: false
      add :kind, :string, null: false
      add :storage_key, :string, null: false
      add :cdn_path, :string, null: false
      add :sha256, :string, null: false
      add :byte_size, :integer, null: false, default: 0
      add :animation_clips, {:array, :string}, null: false, default: []
      add :metadata, :map, null: false, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:asset_3d, [:slug])
    create index(:asset_3d, [:kind])
  end
end
