defmodule MokaidWeb.PaymeWebhookController do
  @moduledoc """
  Public callback endpoint for PayMe hosted payments.

  PayMe POSTs the sale result here (`sale_callback_url`). We reconcile on
  our invoice id (echoed back as `transaction_id`) and double-check the
  PayMe sale id when we stored one at checkout time. Always answers 200 so
  PayMe doesn't retry indefinitely on business-level rejections.
  """

  use MokaidWeb, :controller

  require Logger

  alias Mokaid.Billing
  alias Mokaid.Billing.PayMe

  def callback(conn, params) do
    Logger.info("payme_callback sale=#{params["payme_sale_id"]} status=#{params["sale_status"]}")

    with true <- PayMe.sale_completed?(params),
         invoice_id when is_binary(invoice_id) <- params["transaction_id"],
         {:ok, _uuid} <- Ecto.UUID.cast(invoice_id),
         %{} = invoice <- Billing.get_invoice_by_id(invoice_id),
         true <- payment_reference_matches?(invoice, params) do
      Billing.mark_invoice_paid(invoice, %{
        buyer_key: params["buyer_key"],
        card: card_info(params)
      })
    else
      _ ->
        Logger.warning(
          "payme_callback_ignored #{inspect(Map.take(params, ~w(payme_sale_id sale_status transaction_id)))}"
        )
    end

    json(conn, %{ok: true})
  end

  # When checkout stored the PayMe sale id, the callback must carry the same
  # one — a mismatch means the callback doesn't belong to this invoice.
  defp payment_reference_matches?(invoice, params) do
    stored = invoice.external_payment_id
    is_nil(stored) or stored == params["payme_sale_id"]
  end

  defp card_info(params) do
    mask = params["buyer_card_mask"] || params["buyer_card"] || ""

    case Regex.run(~r/(\d{4})\s*$/, mask) do
      [_, last4] -> %{"last4" => last4, "brand" => params["card_brand"] || "card"}
      _ -> %{}
    end
  end
end
