import { Client } from '@hubspot/api-client';

export const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN || '',
});

export interface HubspotGuestData {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  totalAmount: number;
  itemsSummary: string;
}

export async function createHubspotDeal(guestData: HubspotGuestData) {
  try {
    const nameParts = guestData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const contactResponse = await hubspotClient.crm.contacts.basicApi.create({
      properties: {
        firstname: firstName,
        lastname: lastName,
        phone: guestData.phone,
        email: guestData.email || '',
        city: guestData.city,
        address: guestData.address,
        lifecyclestage: 'customer',
      },
    });

    const contactId = contactResponse.id;

    const dealResponse = await hubspotClient.crm.deals.basicApi.create({
      properties: {
        dealname: `Deal - ${guestData.name} (${guestData.city})`,
        amount: guestData.totalAmount.toString(),
        dealstage: 'qualifiedtobuy',
        pipeline: 'default',
      },
    });

    const dealId = dealResponse.id;

    await hubspotClient.crm.associations.v4.basicApi.createDefault(
      'deal',
      dealId,
      'contact',
      contactId
    );

    return { success: true, contactId, dealId };
  } catch (error: any) {
    console.error('HubSpot Sync Error:', error);
    return { success: false, error: error?.message || 'Unknown HubSpot error' };
  }
}
