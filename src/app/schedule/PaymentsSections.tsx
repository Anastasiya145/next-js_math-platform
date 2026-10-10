"use client";

import { Chip, List, Stack, Typography } from "@mui/material";
import PaymentsIcon from "@mui/icons-material/PaymentsOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongOutlined";
import { api } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { formatDate, formatMoney } from "@/lib/format";
import {
  MAX_PAYMENT_AMOUNT,
  MAX_PAYMENT_NOTE_LENGTH,
  type Payment,
  type PaymentBalance,
  type PaymentsData,
} from "@/lib/payments";
import { todayKyiv } from "@/lib/schedule";
import { AddAction } from "@/components/AddAction";
import { DeleteAction } from "@/components/DeleteAction";
import { EditAction } from "@/components/EditAction";
import type { FieldSpec } from "@/components/FieldsDialog";
import { ItemRow } from "@/components/ItemRow";
import { PageSection } from "@/components/PageSection";
import type { Tone } from "@/components/tones";
import { router } from "../router";

type Props = {
  data: PaymentsData | null;
  loading: boolean;
  error: string | null;
  onReload: () => Promise<unknown>;
};

const paymentFields = (initial: { paidOn: string; amount: string; note: string }): FieldSpec[] => [
  { name: "paidOn", label: "Дата оплати", type: "date", defaultValue: initial.paidOn },
  {
    name: "amount",
    label: "Сума, грн",
    type: "number",
    max: MAX_PAYMENT_AMOUNT,
    maxLength: 7,
    defaultValue: initial.amount,
  },
  {
    name: "note",
    label: "Коментар",
    optional: true,
    maxLength: MAX_PAYMENT_NOTE_LENGTH,
    defaultValue: initial.note,
  },
];

const toBody = (values: Record<string, string>) => ({
  paidOn: values.paidOn,
  amount: Number(values.amount),
  note: values.note,
});

// A positive balance is what parents still owe for held lessons.
const balanceState = ({ earned, paid, balance }: PaymentBalance): { tone: Tone; label: string } => {
  if (balance > 0) return { tone: "warning", label: `До оплати: ${formatMoney(balance)}` };
  if (balance < 0) return { tone: "info", label: `Передоплата: ${formatMoney(-balance)}` };
  return earned > 0 || paid > 0
    ? { tone: "success", label: "Оплачено" }
    : { tone: "secondary", label: "Немає проведених уроків" };
};

// Who owes what, plus the list of payments received in the selected month.
export function PaymentsSections({ data, loading, error, onReload }: Props) {
  const balances = [...(data?.balances ?? [])].sort(
    (first, second) => second.balance - first.balance || first.name.localeCompare(second.name),
  );
  const payments = data?.payments ?? [];
  const monthTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const send = async (method: "POST" | "PATCH", body: Record<string, unknown>) => {
    await api(router.api.payments, {
      method,
      body,
      fallback: errorMessages.payments.saveFailed,
    });
    await onReload();
  };

  const remove = async (payment: Payment) => {
    await api(`${router.api.payments}?id=${payment.id}`, {
      method: "DELETE",
      fallback: errorMessages.payments.deleteFailed,
    });
    await onReload();
  };

  return (
    <>
      <PageSection
        title="Розрахунки з батьками"
        subtitle="Проведені уроки, отримані оплати та залишок до оплати"
        icon={<PaymentsIcon />}
        tone="warning"
        loading={loading}
        error={error}
        empty={balances.length === 0}
        emptyText="Спочатку додайте учнів"
      >
        <List disablePadding>
          {balances.map((line) => {
            const { tone, label } = balanceState(line);
            return (
              <ItemRow
                key={line.studentId}
                tone={tone}
                icon={line.name.charAt(0)}
                primary={line.name}
                secondary={`Проведено на ${formatMoney(line.earned)} · оплачено ${formatMoney(line.paid)}`}
                actions={
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ alignItems: "center", flexShrink: 0 }}
                  >
                    <Chip size="small" color={tone} label={label} />
                    <AddAction
                      label="Відмітити оплату"
                      title={`Оплата: ${line.name}`}
                      icon={<PaymentsIcon />}
                      variant="outlined"
                      size="small"
                      fields={paymentFields({
                        paidOn: todayKyiv(),
                        amount: line.balance > 0 ? String(line.balance) : "",
                        note: "",
                      })}
                      submitLabel="Зберегти"
                      onSubmit={(values) =>
                        send("POST", { studentId: line.studentId, ...toBody(values) })
                      }
                    />
                  </Stack>
                }
              />
            );
          })}
        </List>
      </PageSection>
      <PageSection
        title="Оплати за місяць"
        subtitle={`Отримано за місяць: ${formatMoney(monthTotal)}`}
        icon={<ReceiptLongIcon />}
        tone="primary"
        loading={loading}
        empty={payments.length === 0}
        emptyText="У цьому місяці оплат ще не було"
        action={
          <AddAction
            label="Додати оплату"
            variant="outlined"
            fields={[
              {
                name: "studentId",
                label: "Учень",
                type: "select",
                options: balances.map((line) => [String(line.studentId), line.name]),
              },
              ...paymentFields({ paidOn: todayKyiv(), amount: "", note: "" }),
            ]}
            extraValid={balances.length > 0}
            submitLabel="Зберегти"
            onSubmit={({ studentId, ...values }) =>
              send("POST", { studentId: Number(studentId), ...toBody(values) })
            }
          />
        }
      >
        <List disablePadding>
          {payments.map((payment) => (
            <ItemRow
              key={payment.id}
              tone="success"
              icon={String(Number(payment.paidOn.slice(8)))}
              primary={payment.studentName}
              secondary={[formatDate(payment.paidOn), payment.note].filter(Boolean).join(" · ")}
              actions={
                <Stack direction="row" sx={{ alignItems: "center", flexShrink: 0 }}>
                  <Typography sx={{ fontWeight: 700, mr: 0.5 }}>
                    {formatMoney(payment.amount)}
                  </Typography>
                  <EditAction
                    label={`Редагувати оплату: ${payment.studentName}`}
                    title="Редагувати оплату"
                    fields={paymentFields({
                      paidOn: payment.paidOn,
                      amount: String(payment.amount),
                      note: payment.note,
                    })}
                    onSubmit={(values) => send("PATCH", { id: payment.id, ...toBody(values) })}
                  />
                  <DeleteAction
                    label={`Видалити оплату: ${payment.studentName}`}
                    message={`Оплату ${formatMoney(payment.amount)} від ${formatDate(payment.paidOn)} буде видалено.`}
                    onConfirm={() => remove(payment)}
                  />
                </Stack>
              }
            />
          ))}
        </List>
      </PageSection>
    </>
  );
}
