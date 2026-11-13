import type { Schema, Struct } from '@strapi/strapi';

export interface ServiceCoverageItem extends Struct.ComponentSchema {
  collectionName: 'components_service_coverage_items';
  info: {
    description: 'One card of the "what we cover" grid on a service page';
    displayName: 'Coverage item';
    icon: 'check';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServicePromisePoint extends Struct.ComponentSchema {
  collectionName: 'components_service_promise_points';
  info: {
    description: 'One line of the guarantee list on a service page';
    displayName: 'Promise point';
    icon: 'star';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Page title and description for search engines and social sharing';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'service.coverage-item': ServiceCoverageItem;
      'service.promise-point': ServicePromisePoint;
      'shared.seo': SharedSeo;
    }
  }
}
