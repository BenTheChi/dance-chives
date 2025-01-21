import { useEffect, useState } from 'react';
import { Autocomplete } from '@mantine/core';

interface CountryData {
  country: string;
  cities: string[];
}

interface ApiResponse {
  data: CountryData[];
  error: boolean;
  msg: string;
}

interface CountryCitySelectorProps {
  onChange?: (name: string, country: string) => void;
  selectedCountry: string;
  selectedCity: string;
}

interface AutocompleteItem {
  value: string;
  group?: string;
}

const PRIORITY_COUNTRIES = ['United States', 'Canada', 'Mexico'];

const CountryCitySelector: React.FC<CountryCitySelectorProps> = ({
  onChange,
  selectedCountry,
  selectedCity,
}) => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  // const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  // const [selectedCity, setSelectedCity] = useState<string>('');
  const [countryOptions, setCountryOptions] = useState<AutocompleteItem[]>([]);

  // Prepare country options with priority countries
  const prepareCountryOptions = (countryList: CountryData[]): AutocompleteItem[] => {
    const countries = countryList.map((c) => c.country);
    const priorityItems = PRIORITY_COUNTRIES.filter((country) => countries.includes(country)).map(
      (country) => ({ value: country, group: 'Priority' })
    );

    const otherItems = countries
      .filter((country) => !PRIORITY_COUNTRIES.includes(country))
      .map((country) => ({ value: country, group: 'Other Countries' }));

    return [...priorityItems, ...otherItems];
  };

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async (): Promise<void> => {
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries');
        const data: ApiResponse = await response.json();
        if (!data.error) {
          setCountries(data.data);
          setCountryOptions(prepareCountryOptions(data.data));
        } else {
          console.error('API Error:', data.msg);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  // Update cities when country changes
  const handleCountryChange = (value: string): void => {
    const countryData = countries.find((c) => c.country === value);
    if (countryData) {
      setCities(countryData.cities);
    } else {
      setCities([]);
    }

    onChange?.('', value);
  };

  // Handle city selection
  const handleCityChange = (value: string): void => {
    onChange?.(value, selectedCountry);
  };

  return (
    <div>
      <div className="space-y-4">
        <Autocomplete
          label="Select your country"
          placeholder="Choose a country"
          data={countryOptions}
          value={selectedCountry}
          onChange={handleCountryChange}
          maxDropdownHeight={200}
        />

        <Autocomplete
          label="Select your city"
          placeholder="Choose a city"
          data={cities}
          value={selectedCity}
          onChange={handleCityChange}
          disabled={!selectedCountry}
        />
      </div>
    </div>
  );
};

export default CountryCitySelector;
