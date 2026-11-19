int i2c_addr()
{
    return 0x2A;     // slave address of EETI EXC80W46
}

void setup()
{
    setWAKE(0);      // set reset pin to low
    delay_ms(10);    // wait for 10ms
    setWAKE(1);      // set reset pin to high
    delay_ms(300);   // wait for 300ms
}

void rtouch()
{
    int state_ID = i2c_read16be();   // Byte 0: state; Byte 1: Contact_ID
    int x = i2c_read16le();          // Byte 2: X(LSB); Byte 3: X(MSB)
    int y = i2c_read16le();          // Byte 4: y(LSB); Byte 5: y(MSB)
    
    if ( ((state_ID & 0x0100) == 0x0100) && ((state_ID & 0x00ff) < 5) )
    {
        report_touch( (state_ID & 0xff), x, y);  // send data to report touch
    }
    i2c_read16be();     // Byte 6 & 7: Reserved
    i2c_read16be();     // Byte 8 & 9: Reserved
}

void loop()
{
    while (getINT() == 1)    // wait for INT to go low
        ;

    while (getINT() == 0)    // while INT is low, data is present
    {
        i2c_startread(0x00);         // start offset address from 0x00
        int len = i2c_read16le();    // length of report
        len = len - 2;               // minus the first two bytes (length of report)
    
        if (i2c_read8() == 0x0018)               // Report ID
        {
            int n_touches = i2c_read8();         // Number of contacts
            len = len - (2 + (n_touches * 10));  // calculated the extra bytes to read
        
            while (n_touches > 0)                // call rtouch when n_touches not zero
            {
                rtouch();                
                n_touches = n_touches - 1;
            }
            
            while (len > 0)                      // clear the rest of the data
            {
                i2c_read8();
                len = len - 1;
            }
        }
        else                         // report ID not 0x18
        {
            while (len > 0)          // clear the bytes based on the length
            {
                i2c_read8();
                len = len - 1;
            }    
        }
    }                                // interrupt still low, may have unread data
    i2c_stop();                      // stop i2c transaction.
}