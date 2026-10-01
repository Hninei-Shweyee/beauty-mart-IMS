const DEFAULT_THB_TO_MMK_RATE = 100;

export const getThbToMmkRate = () => {
  const configuredRate = Number(process.env.THB_TO_MMK_RATE || DEFAULT_THB_TO_MMK_RATE);

  return Number.isFinite(configuredRate) && configuredRate > 0
    ? configuredRate
    : DEFAULT_THB_TO_MMK_RATE;
};

export const convertThbToMmk = (amount) => Number(amount || 0) * getThbToMmkRate();

export const calculateProfitMmk = ({ sellPriceMmk, buyPriceThb, quantity }) => {
  const sellPrice = Number(sellPriceMmk || 0);
  const buyPriceMmk = convertThbToMmk(buyPriceThb);
  const itemQuantity = Number(quantity || 0);

  return (sellPrice - buyPriceMmk) * itemQuantity;
};
