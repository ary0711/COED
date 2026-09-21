import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2,
  Plus,
  X,
  Pencil,
  CheckCircle,
} from 'lucide-react';
import {
  saveFacultyMembers,
  deleteFacultyMember,
  uploadFacultyImage,
} from '../../landing-page/services/aboutService';

interface Props {
  content: any;
  updateField: any;
  facultyMembers: any[];
  setFacultyMembers: any;
  departments: any[];
}

interface FacultyForm {
  name: string;
  role: string;
  academic_rank: string;
  education: string;
  experience: string;
  department_id: string;
  member_type: 'teacher' | 'dean';
  image: string;
}

const EMPTY_FACULTY: FacultyForm = {
  name: '',
  role: '',
  academic_rank: '',
  education: '',
  experience: '',
  department_id: '',
  member_type: 'teacher',
  image: '',
};

export default function TeamStructureEditor({
  content,
  updateField,
  facultyMembers,
  setFacultyMembers,
  departments,
}: Props) {
  // Mounting state para safe ang createPortal
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [newFaculty, setNewFaculty] = useState<FacultyForm>(EMPTY_FACULTY);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning',
  });

  const teamData = content?.team_structure || {};

  const showMessage = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setMessageModal({ title, message, type });
    setShowMessageModal(true);
  };

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  const resetFacultyForm = () => {
    setNewFaculty({ ...EMPTY_FACULTY });
    setEditingIndex(null);
    setIsEditing(false);
    setUploadingImage(false);
  };

  const closeFacultyModal = () => {
    resetFacultyForm();
    setShowFacultyModal(false);
  };

  const openAddFacultyModal = (departmentId: string) => {
    setNewFaculty({
      ...EMPTY_FACULTY,
      department_id: departmentId,
      member_type: 'teacher',
    });

    setEditingIndex(null);
    setIsEditing(false);
    setShowFacultyModal(true);
  };

  const openAddDeanModal = () => {
    const existingDean = facultyMembers.find(
      (member: any) => member.member_type === 'dean'
    );

    if (existingDean) {
      showMessage(
        'Dean Already Exists',
        'Only one Dean is allowed. Please edit or delete the existing Dean first.',
        'warning'
      );
      return;
    }

    setNewFaculty({
      ...EMPTY_FACULTY,
      member_type: 'dean',
    });

    setEditingIndex(null);
    setIsEditing(false);
    setShowFacultyModal(true);
  };

  const editFaculty = (member: any, index: number) => {
    setNewFaculty({
      name: member.name || '',
      role: member.role || '',
      academic_rank: member.academic_rank || '',
      education: member.education || '',
      experience: member.experience || '',
      department_id: member.department_id || '',
      member_type: member.member_type === 'dean' ? 'dean' : 'teacher',
      image: member.image || '',
    });

    setEditingIndex(index);
    setIsEditing(true);
    setShowFacultyModal(true);
  };

  /*
   * ---------------------------------------------------------
   * FORM HANDLING
   * ---------------------------------------------------------
   */

  const handleFacultyChange = (field: keyof FacultyForm, value: string) => {
    setNewFaculty((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /*
   * ---------------------------------------------------------
   * SAVE / UPDATE FACULTY
   * ---------------------------------------------------------
   */

  const saveFaculty = async () => {
    const trimmedName = newFaculty.name.trim();
    const trimmedRole = newFaculty.role.trim();

    if (!trimmedName) {
      showMessage('Required Field', 'Please enter the faculty member name.', 'warning');
      return;
    }

    if (!trimmedRole) {
      showMessage('Required Field', 'Please enter the faculty member role.', 'warning');
      return;
    }

    if (newFaculty.member_type !== 'dean' && !newFaculty.department_id) {
      showMessage('Department Required', 'Please select a department.', 'warning');
      return;
    }

    // Prevent more than one Dean
    if (newFaculty.member_type === 'dean') {
      const anotherDean = facultyMembers.some(
        (member: any, index: number) =>
          member.member_type === 'dean' && index !== editingIndex
      );

      if (anotherDean) {
        showMessage('Dean Already Exists', 'Only one Dean is allowed.', 'warning');
        return;
      }
    }

    try {
      const cleanedFaculty = {
        ...newFaculty,
        name: trimmedName,
        role: trimmedRole,
        academic_rank: newFaculty.academic_rank.trim(),
        education: newFaculty.education.trim(),
        experience: newFaculty.experience.trim(),
      };

      let updatedFaculty: any[];

      // EDIT
      if (isEditing && editingIndex !== null && facultyMembers[editingIndex]) {
        const existingMember = facultyMembers[editingIndex];

        updatedFaculty = facultyMembers.map((member: any, index: number) =>
          index === editingIndex
            ? {
                ...member,
                ...cleanedFaculty,
                id: existingMember.id,
                display_order: existingMember.display_order || editingIndex + 1,
              }
            : member
        );
      }
      // ADD
      else {
        const newMember = {
          id: crypto.randomUUID(),
          ...cleanedFaculty,
          display_order: facultyMembers.length + 1,
        };

        updatedFaculty = [...facultyMembers, newMember];
      }

      // SAVE TO SUPABASE
      const result = await saveFacultyMembers(updatedFaculty);

      if (result?.error) {
        throw result.error;
      }

      // Update local state only after Supabase succeeds
      setFacultyMembers(updatedFaculty);
      closeFacultyModal();

      showMessage(
        isEditing ? 'Faculty Updated' : 'Faculty Added',
        isEditing
          ? 'The faculty member has been updated successfully.'
          : 'The faculty member has been added successfully.',
        'success'
      );
    } catch (error: any) {
      console.error('SAVE FACULTY ERROR:', error);
      showMessage('Save Failed', error?.message || 'Failed to save faculty member.', 'error');
    }
  };

  /*
   * ---------------------------------------------------------
   * DELETE
   * ---------------------------------------------------------
   */

  const openDeleteModal = (index: number) => {
    if (index < 0 || index >= facultyMembers.length) {
      return;
    }
    setFacultyToDelete(index);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setFacultyToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDeleteFaculty = async () => {
    if (
      facultyToDelete === null ||
      facultyToDelete < 0 ||
      facultyToDelete >= facultyMembers.length
    ) {
      return;
    }

    const member = facultyMembers[facultyToDelete];

    if (!member) {
      return;
    }

    try {
      // Delete from Supabase first
      if (member.id) {
        await deleteFacultyMember(member.id);
      }

      // Remove from local state
      const updated = facultyMembers.filter(
        (_: any, index: number) => index !== facultyToDelete
      );

      // Re-number display order
      const reordered = updated.map((faculty: any, index: number) => ({
        ...faculty,
        display_order: index + 1,
      }));

      // Save new display order
      if (reordered.length > 0) {
        const result = await saveFacultyMembers(reordered);
        if (result?.error) {
          throw result.error;
        }
      }

      setFacultyMembers(reordered);
      setFacultyToDelete(null);
      setShowDeleteModal(false);

      showMessage(
        'Faculty Deleted',
        'The faculty member has been deleted successfully.',
        'success'
      );
    } catch (error: any) {
      console.error('DELETE FACULTY ERROR:', error);
      showMessage('Delete Failed', error?.message || 'Failed to delete faculty member.', 'error');
    }
  };

  /*
   * ---------------------------------------------------------
   * IMAGE UPLOAD
   * ---------------------------------------------------------
   */

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage(
        'Invalid Image',
        'Please select a valid image file such as JPG, PNG, WEBP, or GIF.',
        'warning'
      );
      e.target.value = '';
      return;
    }

    // Maximum 5MB
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      showMessage(
        'Image Too Large',
        'The faculty image must be smaller than 5MB.',
        'warning'
      );
      e.target.value = '';
      return;
    }

    try {
      setUploadingImage(true);

      const publicUrl = await uploadFacultyImage(file, 'faculty');

      if (!publicUrl) {
        throw new Error('No image URL was returned from Supabase.');
      }

      setNewFaculty((prev) => ({
        ...prev,
        image: publicUrl,
      }));

      showMessage(
        'Photo Uploaded',
        'The faculty photo was uploaded successfully. Click Save Faculty to save the faculty member.',
        'success'
      );
    } catch (error: any) {
      console.error('FACULTY IMAGE UPLOAD ERROR:', error);
      showMessage(
        'Upload Failed',
        error?.message || 'Failed to upload faculty photo. Please check your Supabase Storage policies.',
        'error'
      );
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  /*
   * ---------------------------------------------------------
   * DEAN & SEARCH/GROUPING
   * ---------------------------------------------------------
   */

  const dean = facultyMembers.find((member: any) => member.member_type === 'dean');
  const deanIndex = dean
    ? facultyMembers.findIndex((member: any) => member.id === dean.id)
    : -1;

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const groupedFaculty = departments.map((dept: any) => {
    const members = facultyMembers.filter((member: any) => {
      const belongsToDepartment =
        member.department_id === dept.id && member.member_type !== 'dean';

      if (!belongsToDepartment) return false;
      if (!normalizedSearch) return true;

      return (
        member.name?.toLowerCase().includes(normalizedSearch) ||
        member.role?.toLowerCase().includes(normalizedSearch) ||
        member.academic_rank?.toLowerCase().includes(normalizedSearch)
      );
    });

    return {
      ...dept,
      members,
    };
  });

  const getImageUrl = (image: string) => {
    if (!image) return 'https://via.placeholder.com/150';
    return image;
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="space-y-8">
      {/* =====================================================
          TEAM STRUCTURE CONTENT
      ====================================================== */}
      <div className="bg-white rounded-2xl shadow-md border p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Team Structure Section</h2>
          <p className="text-gray-500 mt-2">
            Manage the heading displayed above the Dean, Chairmen and Faculty Members.
          </p>
        </div>

        {/* SMALL HEADER */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Small Header
          </label>
          <input
            type="text"
            value={teamData.title || ''}
            onChange={(e) => updateField('team_structure', 'title', e.target.value)}
            placeholder="Our Team Structure"
            className="w-full border rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* MAIN HEADING */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Main Heading
          </label>
          <input
            type="text"
            value={teamData.description || ''}
            onChange={(e) => updateField('team_structure', 'description', e.target.value)}
            placeholder="The People Behind the Programs"
            className="w-full border rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={5}
            value={teamData.content || ''}
            onChange={(e) => updateField('team_structure', 'content', e.target.value)}
            placeholder="Our team is a blend of visionaries..."
            className="w-full border rounded-xl p-4 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* =====================================================
          DEAN MANAGEMENT
      ====================================================== */}
      <div className="bg-white rounded-2xl shadow-md border p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dean Information</h2>
            <p className="text-gray-500 mt-2">Manage the current College Dean.</p>
          </div>

          {dean && (
            <button
              type="button"
              onClick={() => editFaculty(dean, deanIndex)}
              className="bg-[#1E3A8A] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#172554] transition-colors"
            >
              <Pencil size={16} />
              Edit Dean
            </button>
          )}
        </div>

        {!dean ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">No Dean has been assigned yet.</p>
            <button
              type="button"
              onClick={openAddDeanModal}
              className="bg-[#1E3A8A] text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-[#172554] transition-colors"
            >
              <Plus size={18} />
              Add Dean
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <img
              src={getImageUrl(dean.image)}
              alt={dean.name || 'College Dean'}
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/150';
              }}
              className="w-40 h-40 rounded-full object-cover border-4 border-blue-100"
            />
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-gray-800">{dean.name}</h3>
              <p className="text-[#1E3A8A] text-lg font-medium mt-1">{dean.role}</p>

              {dean.department_id && (
                <p className="text-sm text-gray-500 mt-2">
                  {departments.find((d: any) => d.id === dean.department_id)?.name}
                </p>
              )}
              {dean.academic_rank && (
                <p className="text-gray-500 mt-2">{dean.academic_rank}</p>
              )}
              {dean.experience && (
                <p className="text-gray-500 mt-2">{dean.experience}</p>
              )}
              {dean.education && (
                <p className="text-gray-400 mt-3">{dean.education}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => editFaculty(dean, deanIndex)}
                className="p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                title="Edit Dean"
              >
                <Pencil size={20} className="text-blue-600" />
              </button>
              <button
                type="button"
                onClick={() => openDeleteModal(deanIndex)}
                className="p-3 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                title="Delete Dean"
              >
                <Trash2 size={20} className="text-red-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          FACULTY MEMBERS
      ====================================================== */}
      <div className="bg-white rounded-2xl shadow-md border p-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Faculty Members</h2>
              <p className="text-gray-500 mt-2">Manage faculty members by department.</p>
            </div>
            <div className="text-sm text-gray-500">
              {facultyMembers.filter((member: any) => member.member_type !== 'dean').length}{' '}
              Faculty Members
            </div>
          </div>

          {/* SEARCH */}
          <div className="relative mt-5 max-w-md">
            <input
              type="text"
              placeholder="Search Faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-xl px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {groupedFaculty.map((dept: any) => (
            <div key={dept.id} className="border rounded-2xl overflow-hidden mb-8">
              {/* DEPARTMENT HEADER */}
              <div className="bg-[#1E3A8A] text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg">{dept.name}</h3>
                  <p className="text-blue-100 text-sm">{dept.members.length} Faculty Members</p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddFacultyModal(dept.id)}
                  className="bg-white text-[#1E3A8A] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  <Plus size={17} />
                  Add Faculty
                </button>
              </div>

              {/* DEPARTMENT BODY */}
              <div className="p-6">
                {dept.members.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    {normalizedSearch
                      ? 'No faculty members match your search.'
                      : 'No faculty members assigned.'}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dept.members.map((member: any) => {
                      const actualIndex = facultyMembers.findIndex(
                        (f: any) => f.id === member.id
                      );

                      return (
                        <div
                          key={member.id}
                          className="bg-gray-50 border rounded-xl p-4 min-h-[450px] flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300"
                        >
                          {/* IMAGE */}
                          <img
                            src={getImageUrl(member.image)}
                            alt={member.name}
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/150';
                            }}
                            className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-blue-100"
                          />

                          <h4 className="text-center font-bold mt-3 min-h-[60px] flex items-center justify-center">
                            {member.name}
                          </h4>

                          <p className="text-center line-clamp-2 min-h-[48px]">
                            {member.role || 'Faculty Member'}
                          </p>

                          <p className="text-center text-sm text-gray-500">
                            {member.academic_rank || '—'}
                          </p>

                          <p className="text-center text-xs text-gray-500 mt-2 min-h-[20px]">
                            {member.experience || '—'}
                          </p>

                          <p
                            className="text-center text-xs text-gray-400 mt-1 line-clamp-3 min-h-[60px]"
                            title={member.education || ''}
                          >
                            {member.education || 'No educational information'}
                          </p>

                          {/* ACTION BUTTONS */}
                          <div className="flex justify-center gap-3 mt-auto pt-4">
                            <button
                              type="button"
                              onClick={() => editFaculty(member, actualIndex)}
                              className="p-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:scale-105 transition-all"
                              title="Edit Faculty"
                            >
                              <Pencil size={18} className="text-blue-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(actualIndex)}
                              className="p-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 hover:scale-105 transition-all"
                              title="Delete Faculty"
                            >
                              <Trash2 size={18} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT FACULTY MODAL
      ====================================================== */}
      {isMounted && showFacultyModal && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center m-0 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative z-[100000]">
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {newFaculty.member_type === 'dean'
                    ? isEditing
                      ? 'Edit Dean'
                      : 'Add Dean'
                    : isEditing
                    ? 'Edit Faculty Member'
                    : 'Add Faculty Member'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">Enter the information below.</p>
              </div>
              <button
                type="button"
                onClick={closeFacultyModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X />
              </button>
            </div>

            {/* FORM */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newFaculty.name}
                  onChange={(e) => handleFacultyChange('name', e.target.value)}
                  className="border rounded-lg p-3 w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
                <input
                  type="text"
                  placeholder="Role"
                  value={newFaculty.role}
                  onChange={(e) => handleFacultyChange('role', e.target.value)}
                  className="border rounded-lg p-3 w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Rank</label>
                <input
                  type="text"
                  placeholder="Academic Rank"
                  value={newFaculty.academic_rank}
                  onChange={(e) => handleFacultyChange('academic_rank', e.target.value)}
                  className="border rounded-lg p-3 w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Years of Experience</label>
                <input
                  type="text"
                  placeholder="e.g. 10 Years"
                  value={newFaculty.experience}
                  onChange={(e) => handleFacultyChange('experience', e.target.value)}
                  className="border rounded-lg p-3 w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {newFaculty.member_type !== 'dean' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
                  <select
                    value={newFaculty.department_id}
                    onChange={(e) => handleFacultyChange('department_id', e.target.value)}
                    className="border rounded-lg p-3 w-full outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Educational Attainment</label>
              <textarea
                rows={4}
                placeholder="Educational Attainment"
                value={newFaculty.education}
                onChange={(e) => handleFacultyChange('education', e.target.value)}
                className="w-full border rounded-lg p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="font-semibold block mb-2">Faculty Photo</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploadingImage}
                onChange={handleImageUpload}
                className="w-full border rounded-lg p-3 cursor-pointer disabled:opacity-50"
              />
              {uploadingImage && (
                <p className="text-blue-600 text-sm mt-2">Uploading photo...</p>
              )}
              {newFaculty.image && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Photo Preview</p>
                  <img
                    src={newFaculty.image}
                    alt="Faculty Preview"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/150';
                    }}
                    className="w-32 h-32 rounded-lg object-cover border"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeFacultyModal}
                className="border px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFaculty}
                disabled={uploadingImage}
                className="bg-[#1E3A8A] text-white px-5 py-2 rounded-lg hover:bg-[#172554] transition-colors disabled:opacity-50"
              >
                {isEditing ? 'Update Faculty' : 'Save Faculty'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}
      {isMounted && showDeleteModal && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-2xl relative z-[100000]">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <Trash2 size={40} className="text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Delete Faculty</h2>
            <p className="text-gray-500">Are you sure you want to delete this faculty member?</p>
            {facultyToDelete !== null && facultyMembers[facultyToDelete] && (
              <p className="font-semibold text-gray-700 mt-3">
                {facultyMembers[facultyToDelete].name}
              </p>
            )}
            <div className="flex justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={cancelDelete}
                className="border px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFaculty}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =====================================================
          GENERAL MESSAGE MODAL
      ====================================================== */}
      {isMounted && showMessageModal && createPortal(
        <div
          className="fixed top-0 left-0 w-screen h-screen z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative z-[100000]">
            <div className="bg-[#1E3A8A] px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {messageModal.type === 'success' ? (
                    <CheckCircle size={24} />
                  ) : (
                    <span className="text-xl font-bold">!</span>
                  )}
                </div>
                <h2 className="text-xl font-bold">{messageModal.title}</h2>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 leading-relaxed">{messageModal.message}</p>
            </div>
            <div className="px-6 pb-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                className="px-6 py-2.5 rounded-lg bg-[#1E3A8A] text-white font-medium hover:bg-[#172554] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}