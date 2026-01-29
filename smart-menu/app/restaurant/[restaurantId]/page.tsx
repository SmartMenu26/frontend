import AiSuggestion from "@/app/components/aiSuggestion/aiSuggestion";
import RestaurantContent from "@/app/components/restaurant/RestaurantContext";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";

type PageProps = { 
  params: Promise<{ restaurantId: string }> // Update type to Promise
};

export default async function RestaurantPage({ params }: PageProps) {
  const { restaurantId } = await params;
  
  console.log("RestaurantPage restaurantId:", restaurantId);

  return (
    <div className="pt-8 flex flex-col gap-6">
      <RestaurantHeader />

      <AiSuggestion restaurantId={restaurantId} />

      <RestaurantContent restaurantId={restaurantId} />
    </div>
  );
}
