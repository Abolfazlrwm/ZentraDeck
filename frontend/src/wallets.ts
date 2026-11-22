export interface CryptoWallet {
  id: string;
  symbol: string;
  name: string;
  networks: string;
  address: string;
  accent: string;
}

export const DONATION_WALLETS: CryptoWallet[] = [
  {
    id: 'trx',
    symbol: 'USDT / TRX',
    name: 'Tether (TRC-20) / TRON',
    networks: 'TRON Network (TRC-20)',
    address: 'TBnY5YZ1YoHF8Yhj2xrZddkSVoNuHuDCby',
    accent: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'evm',
    symbol: 'ETH / EVM',
    name: 'USDT / USDC / ETH / BNB',
    networks: 'Base • BSC (BEP-20) • Ethereum • Arbitrum • Polygon',
    address: '0xC666F61Af8c13877B80aA20812F33c5B98816D33',
    accent: 'from-indigo-500 to-cyan-400',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana / USDC (SPL)',
    networks: 'Solana Network',
    address: '4F2ChdS7KmSYXmCrwHMFsHUWhzC4otcFPMKpYies3ZsY',
    accent: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'ton',
    symbol: 'TON',
    name: 'Toncoin / USDT-TON',
    networks: 'TON Network',
    address: 'UQBc3kWFBxtlwLVQxEPENKLHh5L-CfDtuVaAZ0tSC9VHXKvP',
    accent: 'from-sky-400 to-blue-600',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    networks: 'Bitcoin Network',
    address: '1CF2kJ71Gq79KhEnVJHfLR9pjTSwD5Jgfx',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    id: 'ltc',
    symbol: 'LTC',
    name: 'Litecoin',
    networks: 'Litecoin Network',
    address: 'ltc1q88ujpuj5k43x94qmds6zpslupmrxpa0nlrnqvq',
    accent: 'from-slate-300 to-slate-500',
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: 'Dogecoin',
    networks: 'Dogecoin Network',
    address: 'D7wKth7AujNyXUb1PB9xBNx4jZbTWaFHoY',
    accent: 'from-yellow-400 to-amber-500',
  },
];