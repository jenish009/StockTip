function otpGenerate() {
    const min = 100000; // Smallest 6-digit number (100,000)
    const max = 999999; // Largest 6-digit number (999,999)
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { otpGenerate }