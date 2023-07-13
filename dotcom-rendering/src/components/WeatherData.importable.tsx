import { useApi } from '../lib/useApi';
import type { FEFrontConfigType } from '../types/front';
import { Weather } from './Weather';

/**
 * Our weather API returns 24 forecast.
 * Each forecast is 1 hour offset from the previous forecast, and the first forecast is 1 hour offset from Now.
 */
export type WeatherForecast = [
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
	WeatherData,
];

export type WeatherData = {
	description: string;
	icon: number;
	link?: string;
	dateTime?: string;
	temperature: {
		metric: number;
		imperial: number;
	};
};

export type WeatherApiData = {
	location: {
		id: string;
		city: string;
		country: string;
	};
	weather: WeatherData;
	forecast: WeatherForecast;
};

type Props = {
	ajaxUrl: string;
	edition: FEFrontConfigType['edition'];
};

export const WeatherData = ({ ajaxUrl, edition }: Props) => {
	const { data, error } = useApi<WeatherApiData>(`${ajaxUrl}/weather.json`);

	if (error) {
		window.guardian.modules.sentry.reportError(error, 'weather');
	}

	return !data ? null : (
		<Weather
			location={data.location}
			now={data.weather}
			forecast={data.forecast}
			edition={edition}
		/>
	);
};