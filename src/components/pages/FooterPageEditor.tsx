import SectionDropdown from "../common/SectionDropdown";

import { FooterContentEditor } from "../FooterSectors/FooterContentEditor";
import {FooterQuickLinksEditor }from "../FooterSectors/FooterQuickLinksEditor";
import {FooterSocialLinksEditor }from "../FooterSectors/FooterSocialLinksEditor";

interface Props {
  content: any;
  setContent: any;

  quickLinks: any[];
  setQuickLinks: any;

  socialLinks: any[];
  setSocialLinks: any;
}

export default function FooterPageEditor({
  content,
  setContent,

  quickLinks,
  setQuickLinks,

  socialLinks,
  setSocialLinks,
}: Props) {
  return (
    <>
      <SectionDropdown title="Footer Content">
        <FooterContentEditor
          content={content}
          setContent={setContent}
        />
      </SectionDropdown>

      <SectionDropdown title="Quick Links">
        <FooterQuickLinksEditor
          links={quickLinks}
          setLinks={setQuickLinks}
        />
      </SectionDropdown>

      <SectionDropdown title="Social Links">
        <FooterSocialLinksEditor
          socials={socialLinks}
          setSocials={setSocialLinks}
        />
      </SectionDropdown>
    </>
  );
}