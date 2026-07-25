import SectionDropdown from "../common/SectionDropdown";

import { ContactContentEditor } from "../ContactSectors/ContactContentEditor";
import { ContactOfficeHoursEditor}from "../ContactSectors/ContactOfficeHoursEditor";
import {ContactSocialLinksEditor }from "../ContactSectors/ContactSocialLinksEditor";

interface Props {
  content: any;
  setContent: any;

  officeHours: any[];
  setOfficeHours: any;

  socialLinks: any[];
  setSocialLinks: any;
}

export default function ContactPageEditor({
  content,
  setContent,

  officeHours,
  setOfficeHours,

  socialLinks,
  setSocialLinks,
}: Props) {
  return (
    <>
      <SectionDropdown title="Page Content">
        <ContactContentEditor
          content={content}
          setContent={setContent}
        />
      </SectionDropdown>

      <SectionDropdown title="Office Hours">
        <ContactOfficeHoursEditor
          officeHours={officeHours}
          setOfficeHours={setOfficeHours}
        />
      </SectionDropdown>

      <SectionDropdown title="Social Links">
        <ContactSocialLinksEditor
          socialLinks={socialLinks}
          setSocialLinks={setSocialLinks}
        />
      </SectionDropdown>
    </>
  );
}