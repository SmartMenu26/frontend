import MenuItemDetailsClient from "@/app/components/menuItemDetailsClient.tsx/MenuItemDetailsClient";

type Props = {
  params: Promise<{ menuItemId: string }>;
};

export default async function MenuItemPage({ params }: Props) {
  const { menuItemId } = await params;
  return <MenuItemDetailsClient menuItemId={menuItemId} />;
}
