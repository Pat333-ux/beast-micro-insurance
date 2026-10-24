const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * @route POST /api/insurance/claim/submit
 * @desc Record a new mutual insurance claim submission
 */
router.post("/claim/submit", async (req, res) => {
    try {
        const { claimId, claimantWallet, requestedAmount, evidenceHash } = req.body;
        
        if (!claimId || !claimantWallet || !requestedAmount || !evidenceHash) {
            return res.status(400).json({ success: false, error: "Missing required claim parameters" });
        }

        const query = `
            INSERT INTO claims (claim_id, claimant_wallet, requested_amount, evidence_hash, status)
            VALUES ($1, $2, $3, $4, 'Pending-Review') RETURNING *;
        `;
        const values = [claimId, claimantWallet, requestedAmount, evidenceHash];
        const result = await db.query(query, values);

        res.status(201).json({ success: true, claim: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route POST /api/insurance/claim/payout
 * @desc Update claim record to Paid status following DAO or assessor approval
 */
router.post("/claim/payout", async (req, res) => {
    try {
        const { claimId } = req.body;

        const query = `
            UPDATE claims 
            SET status = 'Paid', paid_at = CURRENT_TIMESTAMP
            WHERE claim_id = $1 RETURNING *;
        `;
        const values = [claimId];
        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Claim ID not found" });
        }

        res.status(200).json({ success: true, paidClaim: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
