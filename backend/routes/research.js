const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

// Submit research
router.post("/", async (req, res) => {
    try {
        const {
            faculty_id,
            title,
            submission_type,
            document_name,
            document_url
        } = req.body;

        const { data, error } = await supabase
            .from("research_submissions")
            .insert([
                {
                    faculty_id,
                    title,
                    submission_type,
                    document_name,
                    document_url,
                    status: "Pending"
                }
            ])
            .select();

        if (error) {
            console.error(error);
            return res.status(400).json(error);
        }

        res.status(201).json(data);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
});

// Get all submissions of one faculty
router.get("/:facultyId", async (req, res) => {

    const { facultyId } = req.params;

    const { data, error } = await supabase
        .from("research_submissions")
        .select("*")
        .eq("faculty_id", facultyId)
        .order("submitted_at", { ascending: false });

    if (error) {
        return res.status(400).json(error);
    }

    res.json(data);
});

module.exports = router;