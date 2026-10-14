export const PREVIEW_INVOICE_ID =
  '0x8d70b41d99bd3b845fc1d0d613cb983abf2a0f0411a6237633d922f53fb08c41';

export const previewInvoice = {
  invoiceId: PREVIEW_INVOICE_ID,
  reference: 'DUE-0042',
  referenceHash:
    '0xa3347db111c01d88089f41886ed3a5f163c76d4d25cd62ff42e2ca0d46ef4c56',
  payer: '0x7A4c3c19A103207A9B847a9B23B6f21f4B92d9D1',
  payee: '0x21aC8f2F3B1A9543783C13d76D5A8c8C40bB6542',
  totalAmount: 10_000n,
  withdrawnAmount: 1_000n,
  refundedAmount: 0n,
  startTime: 1_800_000_000n,
  endTime: 1_800_000_180n,
  canceledAt: 0n,
  metadataHash:
    '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
} as const;

export const previewNow = previewInvoice.startTime + 60n;
