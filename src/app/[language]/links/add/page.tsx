import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ language: string }>;
};

/**
 * Eski "link ekle" adresi.
 *
 * Bu sayfa hicbir zaman yazilmadi; "Add link page coming soon..." yazan bir
 * taslakti. Buna ragmen pano, analytics, ust menu ve onboarding sihirbazinin
 * son adimi kullaniciyi buraya yolluyordu -- yani kurulumu bitiren herkes
 * cikmaz sokakla karsilasiyordu.
 *
 * Link ekleme formu /links uzerinde zaten var (baslik, adres, aciklama, ikon,
 * renkler, kose yuvarlakligi ve canli onizleme). Ayni formu ikinci kez
 * yazmak yerine adresi oraya ceviriyoruz; ?new=1 formu dogrudan aciyor.
 * Yonlendirme, disarida kalmis baglantilar ve yer imleri icin duruyor.
 */
export default async function Page(props: Props) {
  const params = await props.params;

  redirect(`/${params.language}/links?new=1`);
}
