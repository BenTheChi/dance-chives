import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getCityUtcOffset } from '@/utils/getCityTimeZone';  // Your custom utility

const CityInputForm = () => {
  const { control, handleSubmit } = useForm();
  const [utcOffset, setUtcOffset] = useState<string | null>(null);  // Store UTC offset here

  const onSubmit = (data: any) => {
    const offset = getCityUtcOffset(data.city);
    setUtcOffset(offset);  // Update UTC offset when form is submitted
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <FormField
        control={control}
        name="city"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>City</FormLabel>
            <FormControl>
              <Input
                {...field}
                className="bg-white"
                placeholder="Enter City"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <button type="submit" className="btn mt-4">Get UTC Offset</button>

      {utcOffset && (
        <div className="mt-4">
          <p>UTC Offset: {utcOffset}</p>
        </div>
      )}
    </form>
  );
};

export default CityInputForm;
