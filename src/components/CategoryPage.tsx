import React, { useEffect, useMemo, useState } from 'react';
import { Product } from '../types';
import { PLPGrid } from './PLPGrid';
import { Breadcrumbs } from './Breadcrumbs';
import { FilterBar } from './FilterBar';
import { FilterSortModal } from './FilterSortModal';
import { TypePills } from './TypePills';
import { getCategoryLabel } from '../utils/category';
import { toTypeSlug, formatTypeLabel } from '../utils/typeSlug';
import { buildTypeEntries } from '../utils/typeSections';
import { DEFAULT_SITE_TITLE, pageTitle, SITE_NAME } from '../utils/seoText';
import { useParams, useNavigate } from 'react-router-dom';
import { useFilterParams, useFilteredProducts } from '../hooks/useFilteredProducts';
import { SHOP_CONFIG } from '../config/shop';

interface CategoryPageProps {
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
  onNavigateToProduct?: (product: Product) => void;
  products?: Product[];
  catalogueReady?: boolean;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  onAddToCart,
  onOpenConsultation,
  onNavigateToProduct,
  products,
  catalogueReady = true,
}) => {
  // The 3-segment route is served by ProductOrCategoryPage, which hands the
  // last segment to this page only when it is a type slug rather than a
  // product. That route names the segment :productId, so read both param
  // names rather than assuming the old /product/:slug/:typeSlug path.
  const params = useParams<{ slug: string; typeSlug?: string; productId?: string }>();
  const category = params.slug || '';
  const rawTypeSlug = params.productId ?? params.typeSlug;
  const label = getCategoryLabel(category);

  const catalogue = products || [];
  const categoryProducts = useMemo(
    () => catalogue.filter((p) => p.category === category),
    [catalogue, category]
  );

  // The type row describes the CATEGORY, not the page's current scope, so it
  // is derived from `categoryProducts` and never from `typeProducts`: on a
  // type-scoped route `typeProducts` is already narrowed to that one type, which
  // would render a single pill — the active one — and no way to reach any other
  // type. The unsliced set keeps the row complete and stable while the operator
  // narrows, and `useMemo` keeps the derivation off the render path because it
  // is pure in these two inputs.
  const typeSectionConfig = useMemo(
    () => SHOP_CONFIG.typeSections.find((s) => s.category === category),
    [category]
  );

  // `rawTypeSlug` is passed as `ensureSlug` because the config's `limit` is a
  // homepage merchandising number (six cards on "Find your bag"), and honouring
  // it here truncates the very pill the visitor is standing on — on a
  // type-scoped route the row then shows six other types and no current one, so
  // it marks nothing active and offers no way onward.
  const typePills = useMemo(
    () => buildTypeEntries(categoryProducts, category, typeSectionConfig, rawTypeSlug),
    [categoryProducts, category, typeSectionConfig, rawTypeSlug]
  );

  const typeLabel: string | null = useMemo(() => {
    if (!rawTypeSlug) return null;
    const match = categoryProducts.find(
      (p) => p.typeSlug === rawTypeSlug || toTypeSlug(p.tagline) === rawTypeSlug
    );
    return match ? formatTypeLabel(match.tagline) : null;
  }, [categoryProducts, rawTypeSlug]);

  const typeProducts = useMemo(() => {
    if (!rawTypeSlug || !typeLabel) return categoryProducts;
    return categoryProducts.filter(
      (p) => p.typeSlug === rawTypeSlug || toTypeSlug(p.tagline) === rawTypeSlug
    );
  }, [categoryProducts, rawTypeSlug, typeLabel]);

  // The scope the facets resolve against: the URL's own type segment, narrowed.
  // `catalogueReady` keeps the self-heal out of the way while the catalogue is
  // still in flight, so a cold deep link is never stripped before it resolves.
  const filterParams = useFilterParams(typeProducts, catalogueReady);

  const { filtered } = useFilteredProducts(typeProducts, filterParams);

  // The modal is a local overlay, not a route: filter state lives in the query
  // string, so closing it must not touch the URL.
  const [isFilterOpen, setFilterOpen] = useState(false);

  // A type slug that matches nothing in the current catalogue is stale
  // (renamed/removed in the sheet). Redirect to the category page rather
  // than showing an unexplained empty grid.
  const navigate = useNavigate();
  const isStaleTypeSlug =
    !!rawTypeSlug && catalogueReady && categoryProducts.length > 0 && !typeLabel;

  useEffect(() => {
    if (isStaleTypeSlug) {
      navigate(`/product/${category}`, { replace: true });
    }
  }, [isStaleTypeSlug, navigate, category]);

  useEffect(() => {
    document.title = typeLabel
      ? pageTitle(typeLabel, label, SITE_NAME)
      : pageTitle(label, SITE_NAME);
    return () => {
      document.title = DEFAULT_SITE_TITLE;
    };
  }, [typeLabel, label]);

  // While the catalogue is still loading we can't yet distinguish a valid
  // deep link from a stale one; render a neutral loading state instead of
  // flashing "No products match your filters."
  const isLoading = !catalogueReady;

  return (
    <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
      {/* No <Header> here: App.tsx renders the single site-wide header. A second
          copy stacked on top of it swallowed every tap, and because it was
          rendered without `onOpenMenu` the hamburger was a dead button. */}

      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          {SHOP_CONFIG.plp.showBreadcrumbs && (
            <Breadcrumbs
              category={category}
              typeLabel={typeLabel || undefined}
              typeSlug={rawTypeSlug}
            />
          )}

          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-tight">
              {typeLabel ?? label}
            </h1>
          </div>

          {/* Not gated on `isLoading`: while the catalogue is in flight the
              derivation is simply empty and this renders nothing, so the row
              appears with the products instead of the grid shifting down under a
              placeholder. `mb-8` gives the nav its own block so it reads apart
              from the Filter & Sort toolbar below. */}
          {typePills.length > 0 && (
            <div className="mb-8">
              <TypePills
                category={category}
                types={typePills}
                activeSlug={rawTypeSlug}
              />
            </div>
          )}

          {SHOP_CONFIG.plp.showProductCount && !isLoading && (
            <FilterBar
              products={typeProducts}
              surface="plp"
              typeLabel={typeLabel || undefined}
              category={category}
              onOpenFilters={() => setFilterOpen(true)}
            />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-24">
          <PLPGrid
            products={filtered}
            onAddToCart={onAddToCart}
            onOpenConsultation={onOpenConsultation}
            onNavigateToProduct={onNavigateToProduct}
            loading={isLoading}
          />
        </div>
      </main>

      {/* Scope for the facet registry is the page's product set: `typeProducts`
          is already narrowed by the URL's type segment, so the drawer's counts
          and options describe what the operator can actually reach. */}
      <FilterSortModal
        isOpen={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        products={typeProducts}
        context={{ category, typeSlug: rawTypeSlug || undefined }}
        surface="plp"
        resultCount={filtered.length}
      />
    </div>
  );
};
