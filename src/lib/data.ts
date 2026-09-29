import {
  Shirt,
  UserRound,
  Smartphone,
  Sofa,
  SprayCan,
  HeartPulse,
  Dumbbell,
  Baby,
  Car,
  Gamepad2,
} from "lucide-react";

export const categories = [
  { name: "Fashion Pria", icon: Shirt },
  { name: "Fashion Wanita", icon: UserRound },
  { name: "Elektronik", icon: Smartphone },
  { name: "Kebutuhan Rumah", icon: Sofa },
  { name: "Kecantikan", icon: SprayCan },
  { name: "Kesehatan", icon: HeartPulse },
  { name: "Olahraga", icon: Dumbbell },
  { name: "Anak & Bayi", icon: Baby },
  { name: "Otomotif", icon: Car },
  { name: "Hobi & Mainan", icon: Gamepad2 },
];

export const products = [
  {
    id: 1,
    name: "Kemeja Batik Modern",
    image: "/products/batik.jpg",
    rating: 4.8,
    reviews: 120,
    originalPrice: 250000,
    price: 125000,
  },
  {
    id: 2,
    name: "Sneakers",
    image: "/products/sneakers.jpg",
    rating: 4.8,
    reviews: 120,
    originalPrice: 250000,
    price: 125000,
  },
  {
    id: 3,
    name: "Tas Wanita Premium",
    image: "/products/taswanita.jpg",
    rating: 4.8,
    reviews: 120,
    originalPrice: 300000,
    price: 150000,
  },
  {
    id: 4,
    name: "Smartwatch Sport",
    image: "/products/smartwatch.jpg",
    rating: 4.8,
    reviews: 120,
    originalPrice: 800000,
    price: 399000,
  },
];

export const slides = [
  {
    image: "/images/fashion2.png",
    title: "Diskon Spesial 50%",
    subtitle: "Untuk Koleksi Fashion & Lifestyle!",
    cta: "Belanja Sekarang",
    href: "/",
  },
  {
    image: "/images/gadget.png",
    title: "Diskon Spesial 50%",
    subtitle: "Untuk Koleksi Fashion & Lifestyle!",
    cta: "Belanja Sekarang",
    href: "/",
  },
  {
    image: "/images/rumah.png",
    title: "Diskon Spesial 50%",
    subtitle: "Untuk Koleksi Fashion & Lifestyle!",
    cta: "Belanja Sekarang",
    href: "/",
  },
  {
    image: "/images/fashion.png",
    title: "Diskon Spesial 50%",
    subtitle: "Untuk Koleksi Fashion & Lifestyle!",
    cta: "Belanja Sekarang",
    href: "/",
  },
];
