import axios from "axios";
import GameChip from "../../models/GameChip.js";
import PaymentConfigs from "../../models/PaymentConfigs.js";
import WithdrawalHistory from "../../models/WithdrawalHistory.js";
import {
  getMinamount,
  getEstimatedPrice,
  generateOTP,
  getUniqueRequestId,
  encrypt,
  decrypt,
} from "../../helpers/payment.helper.js";
import transporter from "../../helpers/mail.helper.js";
import {getIoInstance} from "../../helpers/socket.helper.js";
import NowPaymentsOrders from "../../models/PaymentOrder.js";
import TempWithdrawalHistory from "../../models/tempWithdrawalRequest.model.js";
import UserNotifications from "../../models/UserNotifications.js";
import { depositmail, withdrawmail } from "../../EmailTemp/mailTemp.js";
import User from "../../models/Users.js";
export default new class PaymentService {
  createPayment = async (req_Body, userPayload) => {
    try {
      const { coin, amount } = req_Body;

      const user = await User.findOne({ _id: userPayload?._id });
      if (!user) {
        return {
          code: 400,
          status: false,
          message: "User not found",
          data: null,
        };
      }

      let crypto;
      if (coin === "USDT ERC-20") crypto = "usdterc20";
      else if (coin === "USDC ERC-20") crypto = "usdc";
      else crypto = coin.toLowerCase();

      const availableCrypto = [
        "btc",
        "eth",
        "trx",
        "ltc",
        "usdterc20",
        "usdc",
        "doge",
        "xrp",
      ];

      if (!availableCrypto.includes(crypto)) {
        return {
          code: 400,
          status: false,
          message: "Please select a valid cryptocurrency.",
          data: null,
        };
      }

      if (isNaN(amount)) {
        return {
          code: 400,
          status: false,
          message: "Invalid amount entered.",
          data: null,
        };
      }

      const validamount = await getMinamount(amount, crypto);
      if (!validamount.status) {
        return {
          code: 400,
          status: false,
          message: `Minimum amount required is $${validamount.min}.`,
          data: null,
        };
      }

      const finalamount = parseInt(amount);
      const payments = await NowPaymentsOrders.create({
        userid: userPayload?._id,
        useremail: user.email,
        amount: finalamount,
        deposite_date: new Date(),
        txnstatus: "pending",
        currency: crypto,
        coin: crypto,
      });

      const options = {
        method: "post",
        url: "https://api.nowpayments.io/v1/payment",
        headers: {
          "x-api-key": "R58B880-3F54VJ4-NWV0GCS-KNRM7DV",
          "Content-Type": "application/json",
        },
        data: {
          price_amount: finalamount,
          price_currency: "usd",
          pay_currency: crypto,
          ipn_callback_url: "https://api.koalabet.io/v1/paycallback",
          order_id: `${payments._id}`,
          order_description: `Koalabet ${coin} deposit`,
        },
      };

      const response = await axios(options);
      const { pay_address, pay_amount } = response.data;

      return {
        code: 200,
        status: true,
        message: "Order created successfully.",
        data: { pay_address, pay_amount, pay_currency: coin },
      };
    } catch (error) {
      console.error("createPayment error:", error);
      return {
        code: 500,
        status: false,
        message: "Internal Server Error",
        data: null,
      };
    }
  };

  withdrawRequest = async (req_Body, userPayload) => {
    try {
      const { amount, chain, walletaddress } = req_Body;
      const user = await User.findOne({ _id: userPayload._id });
      if (!user) {
        return { code: 400, status: false, message: "User not found", data: null };
      }

      const gameChips = await GameChip.findOne({ user_id: userPayload._id });
      if (!gameChips) {
        return { code: 400, status: false, message: "No game balance found", data: null };
      }

      if (isNaN(amount)) {
        return { code: 400, status: false, message: "Invalid amount.", data: null };
      }

      const PaymentConfig = await PaymentConfigs.findOne({});
      if (!PaymentConfig) {
        return { code: 400, status: false, message: "Payment configuration not found.", data: null };
      }

      const withdrawamount = parseFloat(amount).toFixed(2);
      if (withdrawamount < PaymentConfig.minChipsWithdraw) {
        return {
          code: 400,
          status: false,
          message: `Minimum withdrawal amount is $${PaymentConfig.minChipsWithdraw}.`,
          data: null,
        };
      }

      if (withdrawamount > PaymentConfig.maxChipsWithdraw) {
        return {
          code: 400,
          status: false,
          message: `Maximum withdrawal amount is $${PaymentConfig.maxChipsWithdraw}.`,
          data: null,
        };
      }

      const useramount = parseFloat(gameChips.total_chip_amount).toFixed(2);
      if (Number(withdrawamount) > Number(useramount)) {
        return {
          code: 400,
          status: false,
          message: "Withdrawal amount exceeds available balance.",
          data: null,
        };
      }

      const emailOTP = generateOTP();
      const mailOptions = {
        from: "no-reply@koalabet.io",
        to: user.email,
        subject: "Your OTP for Withdrawal Confirmation",
        html: withdrawmail(emailOTP, withdrawamount),
      };
      transporter.sendMail(mailOptions);

      const reqid = getUniqueRequestId();
      await TempWithdrawalHistory.create({
        userid: user._id,
        type_of_withdraw: "usdt",
        withdrawal_chain: chain,
        withdraw_amount: withdrawamount,
        estimated_gas_fee: 5,
        approx_withdraw_amount: withdrawamount - 5,
        requestid: reqid,
        confirmation_otp: emailOTP,
        withdrawl_address: walletaddress,
        data_by_user: req_Body,
      });

      const requestid = encrypt(reqid);
      return {
        code: 200,
        status: true,
        message: "OTP sent successfully.",
        data: { requestid },
      };
    } catch (error) {
      console.error("withdrawRequest error:", error);
      return { code: 500, status: false, message: "Internal Server Error", data: null };
    }
  };

  verifyOtpWithdraw = async (req_Body, userPayload) => {
    try {
      const { requestid, otp } = req_Body;
      const requestId = decrypt(requestid);
      const tempTx = await TempWithdrawalHistory.findOne({ requestid: requestId });

      if (!tempTx) {
        return { code: 400, status: false, message: "Unauthorized request.", data: null };
      }

      if (tempTx.request_count > 3) {
        return {
          code: 400,
          status: false,
          message: "OTP verification limit exceeded. Please retry later.",
          data: null,
        };
      }

      const gameChips = await GameChip.findOne({ user_id: userPayload._id });
      const useramount = parseFloat(gameChips.total_chip_amount).toFixed(2);
      const requestedamount = parseFloat(tempTx.withdraw_amount).toFixed(2);

      if (requestedamount > useramount) {
        return {
          code: 400,
          status: false,
          message: "Withdrawal amount exceeds available balance.",
          data: null,
        };
      }

      if (tempTx.confirmation_otp !== otp) {
        tempTx.request_count += 1;
        await tempTx.save();
        return { code: 400, status: false, message: "Invalid OTP.", data: null };
      }

      const finalamount = Math.max(0, useramount - requestedamount);
      gameChips.total_chip_amount = finalamount;
      await gameChips.save();

      await WithdrawalHistory.create({
        userid: userPayload._id,
        type_of_withdraw: "usdt",
        withdrawal_chain: tempTx.withdrawal_chain,
        withdraw_amount: tempTx.withdraw_amount,
        estimated_gas_fee: 5,
        approx_withdraw_amount: tempTx.withdraw_amount - 5,
        requestid: requestId,
        withdrawl_address: tempTx.withdrawl_address,
        game_chip_balance_before_withdraw: Number(useramount),
        game_chip_balance_after_withdraw: finalamount,
        data_by_user: req_Body,
      });

      return {
        code: 200,
        status: true,
        message:
          "Withdrawal is in process. For large or suspicious amounts, it may require manual review.",
        data: null,
      };
    } catch (error) {
      console.error("verifyOtpWithdraw error:", error);
      return { code: 500, status: false, message: "Internal Server Error", data: null };
    }
  };

  getPaymentConfig = async () => {
    try {
      const payment = await PaymentConfigs.findOne({});
      return {
        code: 200,
        status: true,
        message: "Payment Configs fetched successfully",
        data: payment,
      };
    } catch (error) {
      console.error("getPaymentConfig error:", error);
      return { code: 500, status: false, message: "Internal Server Error", data: null };
    }
  };

 
  payCallBack = async (req_Body) => {
    try {
      const {
        payment_status,
        payment_id,
        price_amount,
        pay_currency,
        order_id,
        pay_amount,
        purchase_id,
        actually_paid,
      } = req_Body;

      const order = await NowPaymentsOrders.findOne({ _id: order_id });
      if (!order) {
        return { code: 400, status: false, message: "Transaction not found", data: null };
      }

      const user = await UserNotifications.findById(order.userid);
      if (!user) {
        return { code: 400, status: false, message: "User not found", data: null };
      }

      const gamebalance = await GameChip.findOne({ user_id: order.userid });
      let usdAmount =
        actually_paid && pay_currency
          ? await getEstimatedPrice(actually_paid, pay_currency, "usd")
          : price_amount;

      const newBalance = parseFloat(gamebalance.total_chip_amount) + parseFloat(usdAmount);

      if (["partially_paid", "finished"].includes(payment_status)) {
        gamebalance.crypto_balances[pay_currency.toLowerCase()] += parseFloat(usdAmount);
        gamebalance.total_chip_amount = parseFloat(newBalance.toFixed(2));
        await gamebalance.save();

        order.payment_id_now_payments = payment_id;
        order.purchase_id_now_payments = purchase_id;
        order.coinamount = pay_amount;
        order.txnstatus = "completed";
        await order.save();

        await UserNotifications.create({
          userId: order.userid,
          notificationtype: "deposit",
          notification_title: `Deposit-${payment_status}`,
          message: `Your deposit of ${pay_amount}${pay_currency} (${usdAmount} USD) is completed successfully.`,
        });

        transporter.sendMail({
          from: "no-reply@koalabet.io",
          to: user.email,
          subject: "Funds Added! Your Deposit is Ready 🎉",
          html: depositmail(pay_amount, pay_currency, price_amount),
        });

        getIoInstance().emit("userNotification", { userid: order.userid });
        return { code: 200, status: true, message: "Transaction successful!", data: null };
      } else if (payment_status === "failed") {
        order.txnstatus = "failed";
        await order.save();
        await UserNotifications.create({
          userId: order.userid,
          notificationtype: "deposit",
          notification_title: "Deposit-Failed",
          message: `Your deposit of ${pay_amount}${pay_currency} (${price_amount} USD) has failed.`,
        });
        getIoInstance().emit("userNotification", { userid: order.userid });
        return { code: 400, status: false, message: "Transaction failed", data: null };
      }
    } catch (error) {
      console.error("payCallBack error:", error);
      return { code: 500, status: false, message: "Internal Server Error", data: null };
    }
  };
}


