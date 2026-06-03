type RestaurantLogo = {
  key: string;
  label: string;
  image: string;
};

type RestaurantLogoCarouselProps = {
  title: string;
  restaurants: RestaurantLogo[];
};

export default function RestaurantLogoCarousel({
  title,
  restaurants,
}: RestaurantLogoCarouselProps) {
  const logoRepeatCount = Math.max(2, Math.ceil(16 / Math.max(restaurants.length, 1)));
  const marqueeRestaurants = Array.from({ length: logoRepeatCount }, (_, repeatIndex) =>
    restaurants.map((restaurant) => ({
      ...restaurant,
      repeatIndex,
    }))
  ).flat();

  return (
    <div className="relative z-20 pt-4">
      <div className="flex flex-col gap-4 text-center md:flex-row md:items-center md:justify-center">
        <h2 className="text-center text-xs font-light uppercase italic text-[#181B25] md:text-lg">
          {title}
        </h2>
      </div>

      {restaurants.length > 0 ? (
        <div className="pt-3 md:pt-4 pb-6">
          <div className="container relative z-20 mx-auto px-4">
            <div
              className="landing-fade overflow-hidden bg-slate-50 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
              style={{ animationDelay: "200ms" }}
            >
              {restaurants.length > 1 ? (
                <div className="restaurant-logo-marquee flex w-max">
                  {[0, 1].map((group) => (
                    <div
                      key={group}
                      className={`flex shrink-0 p-3${
                        group === 1 ? " restaurant-logo-marquee-duplicate" : ""
                      }`}
                      aria-hidden={group === 1}
                    >
                      {marqueeRestaurants.map((restaurant) => (
                        <div
                          key={`${restaurant.key}-${restaurant.repeatIndex}-${group}`}
                          className="flex h-24 w-36 shrink-0 items-center justify-center rounded-2xl sm:h-20 sm:w-32"
                        >
                          <img
                            src={restaurant.image}
                            alt={restaurant.label}
                            className="max-h-full max-w-full rounded-2xl object-contain"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="flex h-24 w-36 items-center justify-center rounded-2xl border border-black/5 bg-white p-4 shadow-[0_15px_35px_rgba(15,24,21,0.06)] sm:h-28 sm:w-44">
                    <img
                      src={restaurants[0].image}
                      alt={restaurants[0].label}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
