import { useState, useRef } from "react";
import styles from "@/app/PaymentForm.module.css";
import { jwtDecode } from "jwt-decode";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
  PayPalHostedFieldsProvider,
  PayPalHostedField,
  PayPalButtons,
  usePayPalHostedFields,
} from "@paypal/react-paypal-js";
import toast from "react-hot-toast";
import { Loader2, ShoppingBasket } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// if payment is successful, show user a toast message
async function createOrderCallback() {
  try {
    const accessTokenResponse = await fetch("/api/paypal-token", { method: "POST" });

    const accessTokenData = await accessTokenResponse.json();

    if (!accessTokenData.access_token) {
      throw new Error("Failed to get access token");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_PAYPAL_API_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessTokenData.access_token}`,
      },
      body: JSON.stringify({
        "intent": "CAPTURE",
        "purchase_units": [{
          "amount": {
            "currency_code": "USD",
            "value": "1.00"
          },
          "description": "30 days subscription"
        }]
      }),
    });

    const orderData = await response.json();

    if (orderData.id) {
      return orderData.id;
    } else {
      const errorDetail = orderData?.details?.[0];
      const errorMessage = errorDetail
        ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
        : JSON.stringify(orderData);

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error(error);
    return `Could not initiate PayPal Checkout...${error}`;
  }
}

async function onApproveCallback(data, actions) {
  try {
    const orderId = data.orderID;

    const accessTokenResponse = await fetch("/api/paypal-token", { method: "POST" });

    const accessTokenData = await accessTokenResponse.json();
    if (!accessTokenData.access_token) {
      throw new Error("Failed to get access token");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessTokenData.access_token}`,
        },
      }
    );

    const orderData = await response.json();
    localStorage.setItem("orderData", JSON.stringify(orderData));
    const transaction =
      orderData?.purchase_units?.[0]?.payments?.captures?.[0];

    if (!transaction || transaction.status !== "COMPLETED") {
      throw new Error(
        `Transaction failed: ${JSON.stringify(orderData, null, 2)}`
      );
    }

    // 1. Update user subscription
    const userId = jwtDecode(localStorage.getItem("token"))._id;
    const subscriptionResponse = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriptionStatus: "Active",
        subscriptionExpiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ), // 30 days from now
      }),
    });

    if (!subscriptionResponse.ok) {
      throw new Error(
        `Failed to update subscription: ${await subscriptionResponse.text()}`
      );
    }

    // 2. Retrieve JWT
    const firebaseUid = jwtDecode(localStorage.getItem("token")).firebaseUid; // Replace with the actual UID
    const tokenResponse = await fetch(`/api/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firebaseUid }),
    });

    if (!tokenResponse.ok) {
      throw new Error(
        `Failed to retrieve token: ${await tokenResponse.text()}`
      );
    }

    const tokenData = await tokenResponse.json();

    localStorage.setItem("token", tokenData.token);

    const cardDetails = orderData.payment_source?.card || {};
    const last4 = cardDetails.last_digits || "0000"; // Default if not available
    const maskedCardNumber = `************${last4}`; // Format: ************1234

    const paypalDetails = orderData.payment_source?.paypal || {};
    const paypalEmail = paypalDetails.email_address || "N/A";
    const accountId = paypalDetails.account_id || "N/A";

    const paymentBody = {
      orderId,
      userId,
      amount: "1.00", // Changed from 30.00 to 1.00
      currency: "USD",
      paymentMethod: cardDetails ? "Card" : "PayPal",
      cardNumber: cardDetails ? maskedCardNumber : "N/A",
      cardBrand: cardDetails ? cardDetails.bin_details.issuing_bank : "N/A",
      paypalEmailAddress: paypalDetails ? paypalEmail : "N/A",
      paypalAccountId: paypalDetails ? accountId : "N/A",
    }

    const paymentResponse = await fetch("/api/payments", {
      method: "POST",
      body: JSON.stringify(
        paymentBody,
      )
    });

    if (!paymentResponse) {
      throw new Error(
        `Failed to create payment: ${await paymentResponse.text()}`
      );
    }

    return `Transaction ${transaction.status}: ${transaction.id}`;
  } catch (error) {
    console.error(error);
    return `Sorry, your transaction could not be processed...${error.message}`;
  }
}


const SubmitPayment = ({ onHandleMessage, investorId }) => {
  const { cardFields } = usePayPalHostedFields();
  const cardHolderName = useRef(null);
  const [Loading, setLoading] = useState(false);
  const router = useRouter();
  const submitHandler = () => {
    if (typeof cardFields.submit !== "function") return;
    setLoading(true);
    cardFields
      .submit({
        cardholderName: cardHolderName?.current?.value,
      })
      .then(async (data) => {
        await onHandleMessage(await onApproveCallback(data));
        toast.success("Payment successful!");
        if (investorId) {
          return router.push(`/search/inner/${investorId}`);
        } else {
          return router.push(`/Thankyou?orderId=${data.orderId}`);
        }
        setLoading(false);
      })
      .catch((orderData) => {
        onHandleMessage(
          `Sorry, your transaction could not be processed...${JSON.stringify(orderData)}`
        );
        toast.error("Sorry, your transaction could not be processed...");
        setLoading(false);
      });
  };

  return (
    <button
      disabled={Loading}
      onClick={submitHandler}
      className="mt-2 bg-green-400 cursor-pointer flex gap-2s items-center justify-center text-black font-bold hover:bg-green-300 w-full p-4"
    >

      {Loading ? <Loader2 className="animate-spin" /> : <><ShoppingBasket className="mr-4" /> Pay Now</>}
    </button>
  );
};

export const PaymentForm = ({ investorId }) => {
  const [message, setMessage] = useState("");

  return (
    <div className="w-full max-w-2xl mx-auto p-2">
      <div className="bg-white rounded-2xl">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Payment Details</h2>
          
          {/* PayPal Button */}
          {/* // Update the description text */}
          <div className="bg-slate-50 p-6 rounded-xl transition-all hover:shadow-md">
            <h4 className="text-slate-700 font-semibold mb-4">Pay with PayPal</h4>
            <p className="text-sm text-gray-600 mb-4">$1.00 - 30 days </p>
            <PayPalButtons
              style={{
                shape: "rect",
                layout: "vertical",
                color: "blue"
              }}
              createOrder={createOrderCallback}
              onApprove={async (data) => setMessage(await onApproveCallback(data))}
            />
          </div>

          {/* Credit Card Form */}
          <div className="bg-slate-50 p-6 rounded-xl space-y-4 transition-all hover:shadow-md">
            <h4 className="text-slate-700 font-semibold mb-4">Pay with Credit Card</h4>
            <PayPalHostedFieldsProvider createOrder={createOrderCallback}
              onApprove={async (data) => setMessage(await onApproveCallback(data))}>
              <div className="space-y-4">
                <PayPalHostedField
                  id="card-number"
                  hostedFieldType="number"
                  options={{
                    selector: "#card-number",
                    placeholder: "Card Number",
                  }}
                  className="w-full p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <div className="grid grid-cols-2 gap-4">
                  <PayPalHostedField
                    id="expiration-date"
                    hostedFieldType="expirationDate"
                    options={{
                      selector: "#expiration-date",
                      placeholder: "Expiration Date",
                    }}
                    className="w-full p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <PayPalHostedField
                    id="cvv"
                    hostedFieldType="cvv"
                    options={{
                      selector: "#cvv",
                      placeholder: "CVV",
                    }}
                    className="w-full p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    id="card-holder"
                    type="text"
                    placeholder="Name on Card"
                    className="w-full p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <input
                    id="card-billing-address-country"
                    type="text"
                    placeholder="Country Code"
                    className="w-full p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Terms Checkbox */}
                <label className="block p-4 bg-white rounded-lg border border-slate-200 transition-all hover:border-emerald-500">
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-slate-600">
                      By pressing "Pay Now" you agree to the <Link href={"/terms"} className="text-emerald-600 hover:text-emerald-700 underline">terms and conditions</Link>
                    </span>
                  </div>
                </label>

                <SubmitPayment investorId={investorId} onHandleMessage={setMessage} />
              </div>
            </PayPalHostedFieldsProvider>
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <div className="mt-6">
        <AlertDialog>
          <AlertDialogTrigger className="w-full p-4 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-all transform hover:scale-[1.01]">
            Cancel Purchase
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure that you want to abandon your purchase
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Link href={"/"}>
                <AlertDialogCancel>Abandon Checkout</AlertDialogCancel>
              </Link>
              <AlertDialogAction className="bg-green-500 hover:bg-green-400">Continue Checkout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
