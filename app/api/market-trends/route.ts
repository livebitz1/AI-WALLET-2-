import { NextResponse } from 'next/server';

export const revalidate = 120; // Revalidate this data every 2 minutes

export async function GET() {
  try {
    // Get API key from environment variables
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    
    if (!apiKey) {
      console.error('CoinMarketCap API key not found');
      return NextResponse.json(
        { error: 'API key not configured' }, 
        { status: 500 }
      );
    }

    // Make the API request to CoinMarketCap
    const response = await fetch(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=30', 
      {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json'
        },
        method: 'GET',
        next: {
          revalidate: 120 // Cache for 2 minutes
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinMarketCap API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch market data' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return only what we need to reduce payload size
    return NextResponse.json({
      data: data.data.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        quote: {
          USD: {
            price: coin.quote.USD.price,
            percent_change_24h: coin.quote.USD.percent_change_24h,
            percent_change_7d: coin.quote.USD.percent_change_7d,
            market_cap: coin.quote.USD.market_cap,
            volume_24h: coin.quote.USD.volume_24h
          }
        }
      })),
      status: {
        timestamp: data.status.timestamp,
        error_code: data.status.error_code,
        error_message: data.status.error_message
      }
    });

  } catch (error) {
    console.error('Error fetching from CoinMarketCap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
