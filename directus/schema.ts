export interface Field { field: string; type: string; schema?: Record<string, unknown>; meta?: Record<string, unknown> }
export interface Collection { collection: string; schema: object; meta: Record<string, unknown>; fields: Field[] }
const id = (): Field => ({ field: 'id', type: 'uuid', schema: { is_primary_key: true }, meta: { special: ['uuid'], hidden: true } })
const str = (field: string, required = false, unique = false): Field => ({ field, type: 'string', schema: { is_nullable: !required, is_unique: unique }, meta: { interface: 'input', required } })
const text = (field: string): Field => ({ field, type: 'text', meta: { interface: 'input-multiline' } })
const num = (field: string, defaultValue = 0): Field => ({ field, type: 'integer', schema: { default_value: defaultValue, is_nullable: false }, meta: { interface: 'input', validation: { [field]: { _gte: 0 } } } })
const bool = (field: string, value = false): Field => ({ field, type: 'boolean', schema: { default_value: value, is_nullable: false }, meta: { interface: 'boolean' } })
const choice = (field: string, values: string[], initial = values[0]): Field => ({ field, type: 'string', schema: { default_value: initial, is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: values.map(value => ({ text: value, value })) }, validation: { [field]: { _in: values } } } })
const status = () => choice('status', ['draft', 'published', 'archived'])
const ref = (field: string, required = true): Field => ({ field, type: 'uuid', schema: { is_nullable: !required }, meta: { special: ['m2o'], interface: 'select-dropdown-m2o', required } })
const collection = (name: string, fields: Field[], note: string): Collection => ({ collection: name, schema: {}, meta: { icon: 'inventory_2', note, display_template: '{{name}}', accountability: 'all' }, fields: [id(), ...fields] })
const labelled = (name: string, extra: Field[] = []) => collection(name, [str('name', true), str('slug', true, true), status(), num('sort'), ...extra], 'Storefront catalogue. Draft by default.')
export const collections: Collection[] = [
  labelled('departments', [text('description')]),
  labelled('categories', [ref('parent_id', false)]),
  labelled('product_types', [text('description')]),
  labelled('brands', [text('description')]),
  collection('media_assets', [str('name', true), str('imagekit_id', true, true), str('path', true), str('alt', true), num('width'), num('height')], 'Public catalogue media only. Never store payment receipts here.'),
  collection('products', [str('name', true), str('slug', true, true), status(), ref('brand_id'), ref('product_type_id'), ref('category_id'), text('description'), str('seo_title'), text('seo_description'), num('sort')], 'Shared product identity across departments. Variants are purchasable units.'),
  collection('product_variants', [ref('product_id'), str('sku', true, true), str('name', true), str('option_key', true, true), num('price_minor'), num('compare_at_minor'), choice('currency', ['PKR']), bool('available'), num('sort')], 'Prices in integer minor units. Availability is provisional until location-aware inventory is connected. option_key is product UUID plus canonical option assignments.'),
  collection('product_departments', [ref('product_id'), ref('department_id')], 'Link products to departments without duplicating variants.'),
  collection('product_media', [ref('product_id'), ref('media_id'), num('sort')], 'Ordered public product gallery.'),
  collection('product_options', [ref('product_id'), str('name', true), num('sort')], 'Purchasable options such as size or storage.'),
  collection('option_values', [ref('option_id'), str('value', true), num('sort')], 'Controlled values for a product option.'),
  collection('variant_option_values', [ref('variant_id'), ref('option_value_id')], 'Option assignments. The service validates complete and unique combinations.'),
  collection('attribute_definitions', [str('name', true), str('key', true, true), choice('data_type', ['text', 'number', 'boolean']), bool('filterable', true)], 'Typed product specifications, distinct from purchasable options.'),
  collection('product_type_attributes', [ref('product_type_id'), ref('attribute_id'), bool('required'), num('sort')], 'Attributes applicable to each product type.'),
  collection('attribute_values', [ref('attribute_id'), str('value', true)], 'Controlled attribute values. Validate against definition data type.'),
  collection('product_attribute_values', [ref('product_id'), ref('attribute_value_id')], 'Product specification values.'),
  labelled('collections', [text('description')]),
  collection('collection_products', [ref('collection_id'), ref('product_id'), num('sort')], 'Curated collection membership.'),
  collection('navigation_menus', [str('name', true), ref('department_id', false), status()], 'Navigation is authored separately from category hierarchy.'),
  collection('navigation_items', [ref('menu_id'), ref('parent_id', false), str('label', true), str('path', true), num('sort')], 'Validated internal navigation paths only.'),
  labelled('pages', [ref('department_id', false), text('description')]),
  collection('page_sections', [ref('page_id'), choice('kind', ['hero', 'text', 'product_rail', 'brand_rail', 'faq']), str('heading'), text('body'), ref('media_id', false), ref('collection_id', false), num('sort'), status(), { field: 'starts_at', type: 'timestamp' }, { field: 'ends_at', type: 'timestamp' }, bool('autoplay')], 'Approved content types only. No arbitrary HTML or executable configuration.'),
  collection('store_settings', [str('name', true), str('contact_email'), str('contact_phone'), choice('currency', ['PKR']), text('footer_text'),str('legal_business_name'),text('billing_address'),str('tax_registration'),choice('tax_treatment',['pending'])], 'Public store identity only. Never add secrets or private operations fields.'),
  collection('submission_limits', [str('key', true, true), str('request_key', true), {field:'date_created',type:'timestamp',meta:{special:['date-created'],readonly:true}}], 'Private durable submission throttle. Remove entries older than seven days through a staff maintenance job.'),
  collection('supplier_applications', [str('reference', true, true), str('idempotency_key', true, true), str('fingerprint', true), str('business_name', true), str('contact_name', true), str('email', true), str('phone', true), text('categories'), str('website'), text('message'), bool('consent'), choice('status', ['received', 'under_review', 'further_information', 'accepted', 'declined']), text('staff_notes'), ref('assigned_to', false), { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], readonly: true } }], 'Private staff review. No public read/list access. Acceptance does not publish products.'),
]
const relation = (collection: string, field: string, related_collection: string) => ({ collection, field, related_collection, meta: { many_collection: collection, many_field: field, one_collection: related_collection, one_field: null as string | null, junction_field: null as string | null, sort_field: null as string | null, one_deselect_action: 'nullify' }, schema: { on_delete: 'RESTRICT' } })
export const relations = [
  relation('categories', 'parent_id', 'categories'),
  relation('products', 'brand_id', 'brands'), relation('products', 'product_type_id', 'product_types'), relation('products', 'category_id', 'categories'),
  relation('product_variants', 'product_id', 'products'), relation('product_departments', 'product_id', 'products'), relation('product_departments', 'department_id', 'departments'),
  relation('product_media', 'product_id', 'products'), relation('product_media', 'media_id', 'media_assets'),
  relation('product_options', 'product_id', 'products'), relation('option_values', 'option_id', 'product_options'),
  relation('variant_option_values', 'variant_id', 'product_variants'), relation('variant_option_values', 'option_value_id', 'option_values'),
  relation('product_type_attributes', 'product_type_id', 'product_types'), relation('product_type_attributes', 'attribute_id', 'attribute_definitions'),
  relation('attribute_values', 'attribute_id', 'attribute_definitions'), relation('product_attribute_values', 'product_id', 'products'), relation('product_attribute_values', 'attribute_value_id', 'attribute_values'),
  relation('collection_products', 'collection_id', 'collections'), relation('collection_products', 'product_id', 'products'),
  relation('navigation_menus', 'department_id', 'departments'), relation('navigation_items', 'menu_id', 'navigation_menus'), relation('navigation_items', 'parent_id', 'navigation_items'),
  relation('pages', 'department_id', 'departments'), relation('page_sections', 'page_id', 'pages'), relation('page_sections', 'media_id', 'media_assets'), relation('page_sections', 'collection_id', 'collections'),
  relation('supplier_applications', 'assigned_to', 'directus_users'),
]

// Editor aliases expose related items without adding duplicate database columns.
const editorRelations = [
  ['product_variants','product_id','products','variants',null,'sort'],
  ['product_options','product_id','products','options',null,'sort'],
  ['option_values','option_id','product_options','values',null,'sort'],
  ['product_departments','product_id','products','departments','department_id',null],
  ['product_media','product_id','products','media','media_id','sort'],
  ['variant_option_values','variant_id','product_variants','option_values','option_value_id',null],
  ['product_attribute_values','product_id','products','attributes','attribute_value_id',null],
  ['product_type_attributes','product_type_id','product_types','attributes','attribute_id','sort'],
  ['collection_products','collection_id','collections','products','product_id','sort'],
  ['page_sections','page_id','pages','sections',null,'sort'],
  ['navigation_items','menu_id','navigation_menus','items',null,'sort'],
] as const
for(const [many,field,one,alias,junction,sort] of editorRelations) {
  collections.find(c=>c.collection===one)!.fields.push({field:alias,type:'alias',meta:{special:[junction?'m2m':'o2m'],interface:junction?'list-m2m':'list-o2m',options:{enableCreate:true,enableSelect:true},width:'full'}})
  const relation=relations.find(r=>r.collection===many && r.field===field)!
  Object.assign(relation.meta,{one_field:alias,junction_field:junction,sort_field:sort,one_deselect_action:'delete'})
}

export function planSchemaChanges(existing: { collection: string }[], fields: { collection: string; field: string }[]) {
  const names = new Set(existing.map(c => c.collection))
  const keys = new Set(fields.map(f => `${f.collection}.${f.field}`))
  return {
    collections: collections.filter(c => !names.has(c.collection)),
    fields: collections.filter(c => names.has(c.collection)).flatMap(c => c.fields.filter(f => !keys.has(`${c.collection}.${f.field}`)).map(f => ({ ...f, collection: c.collection }))),
  }
}
