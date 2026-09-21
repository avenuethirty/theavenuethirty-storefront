import React from 'react';

export const ReturnPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="pt-24">
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Return & Exchange Policy</h1>
          <p className="text-sm text-neutral-600 leading-relaxed mb-10">
            At The Avenue Thirty, we maintain a high standard of quality control and product authenticity across all our listed Labels and regional distributors. Every item dispatched through our central fulfillment network undergoes a verification check before handover to our courier partners.
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed mb-10">
            We operate strictly within Pakistan and process returns and exchanges in accordance with the guidelines below.
          </p>
          <div className="space-y-6 text-sm text-neutral-700">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Eligibility Criteria for Returns and Exchanges</h3>
              <p className="leading-relaxed">
                An item is eligible for a return or exchange only if it meets one of the following conditions upon delivery:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><span className="font-semibold">Defective or Damaged Goods:</span> The product arrived physically damaged, broken, or in non-functional condition.</li>
                <li><span className="font-semibold">Incorrect Item Dispatched:</span> The item received differs in size, color, model, or specification from the order details confirmed at checkout.</li>
                <li><span className="font-semibold">Missing Components:</span> The package is incomplete or missing advertised accessories, documentation, or parts.</li>
              </ul>
              <p className="leading-relaxed mt-2">
                To qualify for a return or exchange, the item must be in its original, unused condition, with all original tags, security seals, branded flyers, warranty cards, and packaging intact.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Category-Specific Return Conditions</h3>
              <p className="leading-relaxed">
                Due to safety, hygiene, and technical verification requirements across our multi-category platform, specific product categories carry distinct return parameters:
              </p>
              <div className="mt-2 space-y-2">
                <p><span className="font-semibold">Designer Fashion & Apparel</span></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Items must be unworn, unwashed, and free of stains, perfume scents, or alterations.</li>
                  <li>All original designer tags and label packaging must remain attached.</li>
                  <li>Customized, altered, or tailor-stitched items cannot be returned or exchanged unless there is an underlying material defect.</li>
                </ul>
                <p className="mt-2"><span className="font-semibold">Mobile Technology & Smart Devices</span></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Devices must be returned in their original unopened box with factory seals intact.</li>
                  <li>Once a mobile device or electronic item box seal is broken or activated, it cannot be returned under a standard change of mind request.</li>
                  <li>For technical issues or manufacturing defects identified after unboxing, the item will be routed through the official brand warranty or authorized distributor network in Pakistan.</li>
                </ul>
                <p className="mt-2"><span className="font-semibold">White Appliances & Large Home Essentials</span></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Mandatory On-Spot Inspection: Customers must inspect appliances visually at the time of delivery before signing the courier handover slip.</li>
                  <li>Doorstep Refusal Protocol: If an appliance shows external physical damage, denting, or transit breakage upon arrival, the delivery must be refused immediately at the doorstep and our support team notified within 24 hours.</li>
                  <li>Post-Delivery Defects: Installed or used appliances are non-returnable through standard returns. Any functional defects identified post-delivery are routed through the authorized regional brand or distributor warranty service network in Pakistan.</li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Non-Returnable Items</h3>
              <p className="leading-relaxed">
                For health, safety, and operational reasons, the following categories are strictly non-returnable once delivered:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Personal care, grooming items, and unsealed cosmetics.</li>
                <li>Innerwear, socks, and intimate apparel.</li>
                <li>Mobile devices or tech accessories with broken security seals.</li>
                <li>Products purchased during clearance sales or final promotional markdowns.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Reporting Window & Timeline</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-semibold">Notification Window:</span> You must report any damage, defect, or incorrect delivery within 48 hours of parcel receipt. Reports submitted after 48 hours will not be eligible for return or replacement.</li>
                <li><span className="font-semibold">Resolution SLA:</span> Once approved, pickup and processing of exchanged or returned items take between 3 to 7 business days depending on your city.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Return Process & Centralized Pickup</h3>
              <p className="leading-relaxed">
                We manage all pickups directly through our central courier network across Pakistan.
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li><span className="font-semibold">Submit a Request:</span> Contact our customer support team via WhatsApp or email with your Order ID, clear photos or an unboxing video of the product, and a brief description of the issue.</li>
                <li><span className="font-semibold">Verification Check:</span> Our quality team reviews the claim within 24 business hours.</li>
                <li><span className="font-semibold">Reverse Pickup:</span> Upon claim approval, our courier partner will collect the parcel directly from your delivery address.</li>
                <li><span className="font-semibold">Inspection & Replacement:</span> Once the item arrives at our central inspection facility and passes verification, your replacement item will be dispatched or refund initiated.</li>
              </ol>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Refunds & Cash on Delivery (COD) Settlements</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-semibold">Cash on Delivery (COD) Orders:</span> Refunds for orders paid via Cash on Delivery are processed as Store Credit or issued via direct bank transfer or digital wallet (JazzCash, EasyPaisa) after product inspection. Cash refunds are not handed out by courier delivery riders.</li>
                <li><span className="font-semibold">Online Payments:</span> Card payments will be refunded back to the original payment method within 7 to 10 business days following inspection approval.</li>
                <li><span className="font-semibold">Shipping & Handling Fees:</span> Original delivery and handling charges are non-refundable unless the return is due to a verified error on our part (damaged or incorrect product delivered).</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Change of Mind Policy</h3>
              <p className="leading-relaxed">
                We do not offer cash refunds for change of mind requests after an order has been dispatched. Store credit or item exchange may be provided at our discretion, subject to applicable re-handling and pickup courier fees.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Customer Support Contact</h3>
              <p className="leading-relaxed">
                For return requests, dispatch updates, or policy questions:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><span className="font-semibold">WhatsApp Support:</span> Official WhatsApp Channel</li>
                <li><span className="font-semibold">Email:</span> support@theavenuethirty.com</li>
                <li><span className="font-semibold">Operating Hours:</span> Monday to Saturday | 10:00 AM to 6:00 PM PKT</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
