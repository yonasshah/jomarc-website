export default {
  name: 'equipment',
  title: 'Equipment',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Equipment Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Hobart Mixers', value: 'mixers'},
          {title: 'Agitators, Parts & Accessories', value: 'parts'},
          {title: 'Stainless Steel Bowls', value: 'bowls'}
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'quartSize',
      title: 'Quart Size',
      type: 'number',
      description: 'Used to sort items from smallest to largest',
    },
    {
      name: 'inStock',
      title: 'Stock Status',
      type: 'boolean',
      description: 'Check if equipment is currently in stock',
      initialValue: true
    },
    {
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      description: 'Brief description for equipment cards (1-2 sentences)'
    },
    {
      name: 'fullDescription',
      title: 'Full Description',
      type: 'text',
      rows: 8,
      description: 'Complete description for equipment detail page'
    },
    {
      name: 'condition',
      title: 'Condition',
      type: 'string',
      options: {
        list: [
          {title: 'Fully Refurbished', value: 'Fully Refurbished'},
          {title: 'New', value: 'New'},
          {title: 'Good Condition', value: 'Good Condition'}
        ]
      }
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
      description: 'Additional images for detail page'
    },
    {
      name: 'brand',
      title: 'Brand',
      type: 'string'
    },
    {
      name: 'model',
      title: 'Model Number',
      type: 'string'
    },
    {
      name: 'weight',
      title: 'Weight',
      type: 'string',
      description: 'e.g., "1,580 lbs net; 1,670 lbs shipping"'
    },
    {
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'Optional - leave empty for "Call for Pricing"'
    },
    {
      name: 'shippingNote',
      title: 'Shipping Note',
      type: 'string',
      description: 'e.g., "Freight charges to be added to price"',
      initialValue: 'Freight charges to be added to price'
    },
    {
      name: 'specifications',
      title: 'Specifications',
      type: 'array',
      description: 'Add specification sections (e.g., MOTOR, ELECTRICAL)',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'section',
            type: 'string',
            title: 'Section Name',
            description: 'e.g., "MOTOR", "ELECTRICAL", "STANDARD FEATURES"'
          },
          {
            name: 'items',
            type: 'array',
            title: 'Specification Items',
            of: [{type: 'string'}],
            description: 'Add bullet points for this section'
          }
        ],
        preview: {
          select: {
            title: 'section',
            items: 'items'
          },
          prepare(selection) {
            const {title, items} = selection
            return {
              title: title,
              subtitle: items ? `${items.length} items` : 'No items'
            }
          }
        }
      }]
    }
  ],
  preview: {
    select: {
      title: 'name',
      condition: 'condition',
      inStock: 'inStock',
      media: 'mainImage'
    },
    prepare(selection) {
      const {title, condition, inStock, media} = selection
      const stockStatus = inStock ? '✓ In Stock' : '✗ Out of Stock'
      return {
        title: title,
        subtitle: `${condition || 'No condition'} • ${stockStatus}`,
        media: media
      }
    }
  }
}