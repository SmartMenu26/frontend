type ViewOptions = {
  restaurantId?: string | null;
  menuItemId?: string | null;
};

export async function incrementMenuItemView({ restaurantId, menuItemId }: ViewOptions) {
  if (!restaurantId || !menuItemId) return;

  try {
    await fetch(`/api/menuItems/${restaurantId}/menu-items/${menuItemId}/views`, {
      method: "PATCH",
      keepalive: true,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to increment menu item view", error);
    }
  }
}
