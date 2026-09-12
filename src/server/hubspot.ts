export interface HubspotGuestData {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  totalAmount: number;
  itemsSummary: string;
}

export interface SellerLeadData {
  brandName: string;
  contactName: string;
  phone: string;
  email?: string;
  category: string;
  message?: string;
}

export async function createSellerLead(lead: SellerLeadData) {
  try {
    const token = process.env.HUBSPOT_ACCESS_TOKEN || '';
    if (!token) {
      console.error('HubSpot token missing');
      return { success: false, error: 'Missing HubSpot access token' };
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const nameParts = lead.contactName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const contactResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          phone: lead.phone,
          email: lead.email || '',
          lifecyclestage: 'lead',
        },
      }),
    });

    if (!contactResponse.ok) {
      const text = await contactResponse.text();
      throw new Error(`HubSpot contact create failed: ${contactResponse.status} ${text}`);
    }

    const contactData = await contactResponse.json();
    const contactId = contactData.id;

    const dealResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          dealname: `Seller Lead — ${lead.brandName} (${lead.category})`,
          amount: '0',
          dealstage: 'qualifiedtobuy',
          pipeline: 'default',
          description: lead.message || '',
        },
      }),
    });

    if (!dealResponse.ok) {
      const text = await dealResponse.text();
      throw new Error(`HubSpot deal create failed: ${dealResponse.status} ${text}`);
    }

    const dealData = await dealResponse.json();
    const dealId = dealData.id;

    const associationResponse = await fetch(
      `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`,
      {
        method: 'PUT',
        headers,
      }
    );

    if (!associationResponse.ok) {
      const text = await associationResponse.text();
      throw new Error(`HubSpot association failed: ${associationResponse.status} ${text}`);
    }

    return { success: true, contactId, dealId };
  } catch (error: any) {
    console.error('HubSpot Seller Lead Error:', error);
    return { success: false, error: error?.message || 'Unknown HubSpot error' };
  }
}

export async function createHubspotDeal(guestData: HubspotGuestData) {
  try {
    const token = process.env.HUBSPOT_ACCESS_TOKEN || '';
    if (!token) {
      console.error('HubSpot token missing');
      return { success: false, error: 'Missing HubSpot access token' };
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const nameParts = guestData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const contactResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          phone: guestData.phone,
          email: guestData.email || '',
          city: guestData.city,
          address: guestData.address,
          lifecyclestage: 'customer',
        },
      }),
    });

    if (!contactResponse.ok) {
      const text = await contactResponse.text();
      throw new Error(`HubSpot contact create failed: ${contactResponse.status} ${text}`);
    }

    const contactData = await contactResponse.json();
    const contactId = contactData.id;

    const dealResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          dealname: `Deal - ${guestData.name} (${guestData.city})`,
          amount: guestData.totalAmount.toString(),
          dealstage: 'qualifiedtobuy',
          pipeline: 'default',
        },
      }),
    });

    if (!dealResponse.ok) {
      const text = await dealResponse.text();
      throw new Error(`HubSpot deal create failed: ${dealResponse.status} ${text}`);
    }

    const dealData = await dealResponse.json();
    const dealId = dealData.id;

    const associationResponse = await fetch(
      `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`,
      {
        method: 'PUT',
        headers,
      }
    );

    if (!associationResponse.ok) {
      const text = await associationResponse.text();
      throw new Error(`HubSpot association failed: ${associationResponse.status} ${text}`);
    }

    return { success: true, contactId, dealId };
  } catch (error: any) {
    console.error('HubSpot Sync Error:', error);
    return { success: false, error: error?.message || 'Unknown HubSpot error' };
  }
}
