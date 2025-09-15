import { NextRequest, NextResponse } from 'next/server';

// ActiveCampaign API configuration
const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL || 'https://ausbeds80383.activehosted.com';
const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;
const AC_LIST_ID = process.env.ACTIVECAMPAIGN_LIST_ID || '6';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request
    if (!body.customerEmail || !body.customerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!AC_API_KEY) {
      return NextResponse.json(
        { error: 'ActiveCampaign API key not configured' },
        { status: 500 }
      );
    }

    // Step 1: Create or update the contact
    const contactData = {
      contact: {
        email: body.customerEmail,
        firstName: body.customerName.split(' ')[0],
        lastName: body.customerName.split(' ').slice(1).join(' ') || '',
        phone: body.customerPhone || '',
        fieldValues: [
          {
            field: '1', // Assuming field ID 1 is for address - adjust as needed
            value: body.shippingAddress || body.customerAddress || ''
          }
        ]
      }
    };

    // Add delivery time as a custom field if provided
    if (body.deliveryTime) {
      contactData.contact.fieldValues.push({
        field: '2', // Assuming field ID 2 is for delivery time - adjust as needed
        value: body.deliveryTime
      });
    }

    // Create/update contact
    const contactResponse = await fetch(`${AC_API_URL}/api/3/contact/sync`, {
      method: 'POST',
      headers: {
        'Api-Token': AC_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    if (!contactResponse.ok) {
      const error = await contactResponse.text();
      console.error('ActiveCampaign contact sync failed:', error);
      return NextResponse.json(
        { error: 'Failed to sync contact with ActiveCampaign' },
        { status: 500 }
      );
    }

    const contactResult = await contactResponse.json();
    const contactId = contactResult.contact.id;

    // Step 2: Add contact to list
    const listData = {
      contactList: {
        list: AC_LIST_ID,
        contact: contactId,
        status: '1' // 1 = Active
      }
    };

    const listResponse = await fetch(`${AC_API_URL}/api/3/contactLists`, {
      method: 'POST',
      headers: {
        'Api-Token': AC_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(listData)
    });

    if (!listResponse.ok) {
      console.error('Failed to add contact to list:', await listResponse.text());
    }

    // Step 3: Always add "shipping tomorrow" tag
    // First, get or create the tag
    const tagData = {
      tag: {
        tag: 'shipping tomorrow',
        tagType: 'contact'
      }
    };

    const tagResponse = await fetch(`${AC_API_URL}/api/3/tags`, {
      method: 'POST',
      headers: {
        'Api-Token': AC_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tagData)
    });

    if (tagResponse.ok) {
      const tagResult = await tagResponse.json();
      const tagId = tagResult.tag.id;

      // Add tag to contact
      const contactTagData = {
        contactTag: {
          contact: contactId,
          tag: tagId
        }
      };

      await fetch(`${AC_API_URL}/api/3/contactTags`, {
        method: 'POST',
        headers: {
          'Api-Token': AC_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactTagData)
      });
    }

    // Step 4: Add note with invoice details
    const noteData = {
      note: {
        relid: contactId,
        reltype: 'Contact',
        note: `Invoice: ${body.invoiceNumber}\nAmount: $${body.totalAmount}\nDelivery Time: ${body.deliveryTime || 'Not specified'}`
      }
    };

    await fetch(`${AC_API_URL}/api/3/notes`, {
      method: 'POST',
      headers: {
        'Api-Token': AC_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(noteData)
    });

    return NextResponse.json({ 
      success: true,
      message: 'Contact successfully added to ActiveCampaign',
      contactId: contactId
    });

  } catch (error) {
    console.error('ActiveCampaign API error:', error);
    return NextResponse.json(
      { error: 'Failed to process ActiveCampaign request' },
      { status: 500 }
    );
  }
}
