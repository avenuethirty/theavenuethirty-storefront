import React, { useEffect, useMemo, useState } from "react";
import { Product } from "../types";
import { PLPGrid } from "../components/PLPGrid";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FilterBar } from "../components/FilterBar";
import { FilterSortModal } from "../components/FilterSortModal";
import { getCollectionBySlug, matchCollection } from "../utils/collections";
import { useParams } from "react-router-dom";
import { useFilterParams, useFilteredProducts } from "../hooks/useFilteredProducts";
import { SHOP_CONFIG } from "../config/shop";
import { EmptyState } from "../components/EmptyState";
import { DEFAULT_SITE_TITLE, pageTitle, SITE_NAME } from "../utils/seoText";

interface CollectionPageProps {
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
  onNavigateToProduct?: (product: Product) => void;
  products?: Product[];
  catalogueReady?: boolean;
}

export const CollectionPage: React.FC<CollectionPageProps> = ({
  onAddToCart,
  onOpenConsultation,
  onNavigateToProduct,
  products,
  catalogueReady = true,
}) => {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  const collection = getCollectionBySlug(collectionSlug || "");
  const catalogue = products || [];

  const matchedProducts = useMemo(
    () => (collection ? matchCollection(catalogue, collection.match) : []),
    [catalogue, collection]
  );

  // The collection's own set is the scope: a facet value that matches nothing
  // here cannot be selected, so the URL is healed against these rows.
  // `surface` must match the modal's, or the badge could count a filter the
  // Collection facet does not render (it is `surfaces: ["plp"]`).
  const filterParams = useFilterParams(matchedProducts, catalogueReady, "collection");

  const { filtered } = useFilteredProducts(matchedProducts, filterParams);

  const [isFilterOpen, setFilterOpen] = useState(false);

  const isLoading = !catalogueReady;

  useEffect(() => {
    if (collection) {
      document.title = pageTitle(collection.title, SITE_NAME);
    } else {
      document.title = pageTitle("Collection Not Found", SITE_NAME);
    }
    return () => {
      document.title = DEFAULT_SITE_TITLE;
    };
  }, [collection]);

  if (!collection) {
    return (
      <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
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
      {/* No <Header> here: App.tsx renders the single site-wide header. A second
          copy stacked on top of it swallowed every tap, and because it was
          rendered without `onOpenMenu` the hamburger was a dead button. */}

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
              products={matchedProducts}
              surface="collection"
              onOpenFilters={() => setFilterOpen(true)}
            />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-24">
          {isLoading ? (
            <PLPGrid products={[]} onAddToCart={onAddToCart} onOpenConsultation={onOpenConsultation} onNavigateToProduct={onNavigateToProduct} loading />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={`No ${collection.title} available`}
              subtitle="Check back soon or browse our other collections."
              action={{ label: "Continue Shopping", href: "/" }}
            />
          ) : (
            <PLPGrid products={filtered} onAddToCart={onAddToCart} onOpenConsultation={onOpenConsultation} onNavigateToProduct={onNavigateToProduct} loading={false} />
          )}
        </div>
      </main>

      {/* `surface="collection"` drops the Collection facet: this page is already
          a single collection, so offering it as a filter would be a one-option
          group. */}
      <FilterSortModal
        isOpen={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        products={matchedProducts}
        context={{ category: collection?.slug }}
        surface="collection"
        resultCount={filtered.length}
      />
      {/* Nothing route-shaped is passed. `context.category` is the COLLECTION
          slug here, and treating it as a category is what used to build
          `/product/<collection-slug>` and dead-end every collection page. Type
          removal is an in-place value-level param write on every surface. */}
    </div>
  );
};
