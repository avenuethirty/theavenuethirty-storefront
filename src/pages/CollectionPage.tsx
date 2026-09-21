import React, { useEffect, useMemo } from "react";
import { Product } from "../types";
import { Header } from "../components/Header";
import { PLPGrid } from "../components/PLPGrid";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FilterBar } from "../components/FilterBar";
import { getCollectionBySlug, matchCollection } from "../utils/collections";
import { useParams, useSearchParams } from "react-router-dom";
import { parseFilterParams, useFilteredProducts } from "../hooks/useFilteredProducts";
import { SHOP_CONFIG } from "../config/shop";
import { EmptyState } from "../components/EmptyState";

interface CollectionPageProps {
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenLocation: () => void;
  products?: Product[];
  catalogueReady?: boolean;
}

export const CollectionPage: React.FC<CollectionPageProps> = ({
  onAddToCart,
  onOpenConsultation,
  cartCount,
  onOpenCart,
  onOpenLocation,
  products,
  catalogueReady = true,
}) => {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  const collection = getCollectionBySlug(collectionSlug || "");
  const catalogue = products || [];

  const [searchParams] = useSearchParams();
  const filterParams = parseFilterParams(searchParams);

  const matchedProducts = useMemo(
    () => (collection ? matchCollection(catalogue, collection.match) : []),
    [catalogue, collection]
  );

  const { filtered } = useFilteredProducts(matchedProducts, filterParams);

  const isLoading = !catalogueReady;

  useEffect(() => {
    if (collection) {
      document.title = `${collection.title} | The Avenue Thirty`;
    } else {
      document.title = "Collection Not Found | The Avenue Thirty";
    }
    return () => {
      document.title = "The Avenue Thirty — Curated Fashion & Skincare";
    };
  }, [collection]);

  if (!collection) {
    return (
      <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
        <Header cartCount={cartCount} onOpenCart={onOpenCart} onOpenConsultation={onOpenConsultation} onOpenLocation={onOpenLocation} />
        <main className="pt-24">
          <EmptyState
            title="Collection not found"
            subtitle="The collection you're looking for doesn't exist or has been removed."
            action={{ label: "Continue Shopping", href: "/" }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
      <Header
        cartCount={cartCount}
        onOpenCart={onOpenCart}
        onOpenConsultation={onOpenConsultation}
      />

      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          {SHOP_CONFIG.plp.showBreadcrumbs && (
            <Breadcrumbs
              category={collection.slug}
              typeLabel={undefined}
              typeSlug={undefined}
            />
          )}

          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-tight">
              {collection.title}
            </h1>
            {collection.subtitle && (
              <p className="mt-2 text-sm text-[#5E5E5E] max-w-xl leading-relaxed">
                {collection.subtitle}
              </p>
            )}
          </div>

          {SHOP_CONFIG.plp.showProductCount && !isLoading && (
            <FilterBar
              totalProducts={filtered.length}
              typeLabel={undefined}
              category={collection.slug}
            />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-24">
          {isLoading ? (
            <PLPGrid products={[]} onAddToCart={onAddToCart} onOpenConsultation={onOpenConsultation} loading />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={`No ${collection.title} available`}
              subtitle="Check back soon or browse our other collections."
              action={{ label: "Continue Shopping", href: "/" }}
            />
          ) : (
            <PLPGrid products={filtered} onAddToCart={onAddToCart} onOpenConsultation={onOpenConsultation} loading={false} />
          )}
        </div>
      </main>
    </div>
  );
};
