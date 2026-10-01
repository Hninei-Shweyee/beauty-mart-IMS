const kyatFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
});

const bahtFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const formatKyat = (value) => `${kyatFormatter.format(Number(value || 0))} MMK`;
export const formatBaht = (value) => `${bahtFormatter.format(Number(value || 0))} THB`;
