import LegalLayout from '../../components/LegalLayout';

export default function PremiumAgreement() {
  return (
    <LegalLayout title="Premium Agreement">
      <p>Before purchasing Premium, please agree to the following:</p>
      <ul>
        <li>Premium access is personal.</li>
        <li>Downloads are only for personal study.</li>
        <li>Premium cannot be transferred.</li>
        <li>Sharing Premium content may result in permanent termination without refund.</li>
      </ul>
    </LegalLayout>
  );
}
