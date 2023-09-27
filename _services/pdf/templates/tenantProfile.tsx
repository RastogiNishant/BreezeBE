import { StyleSheet, View, Text } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  mainSection: {
    marginTop: '10px',
    fontFamily: 'Montserrat',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '5px',
  },
  isBold: {
    fontWeight: 700,
  },
  label: {
    marginTop: '1px',
  },
  labelStyles: {
    backgroundColor: '#F6FCFC',
    fontSize: '7px',
    paddingLeft: '7px',
    borderRadius: '5px',
    marginBottom: '5px',
    alignItems: 'center',
    flexDirection: 'row',
    height: 15,
  },
  numbersStyles: {
    backgroundColor: '#F6FCFC',
    borderRadius: '5px',
    marginBottom: '5px',
    height: 20,
    fontWeight: 'light',
    color: '#000000',
    alignItems: 'center',
    flexDirection: 'row',
    fontSize: '7px',
    paddingLeft: '7px',
  },
  tenantTitle: {
    flex: '0 0 33%',
  },
  tenantItems: {
    flex: '0 0 67%',
    flexDirection: 'row',
  },
  rowWrapper: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: '5px',
  },
  optionStyles: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    marginLeft: '7.5px',
  },
  headerWrapperStyles: {
    backgroundColor: '#F6FCFC',
    borderRadius: '5px',
    fontFamily: 'Montserrat',
    fontWeight: 700,
    fontSize: '10px',
    marginBottom: '5px',
    height: 20,
    color: '#00ACD4',
  },
  headerStyles: {
    paddingTop: '3.5px',
    marginLeft: '7px',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const TenantProfile = ({
  tenantHeader,
  firstLabel,
  secondLabel,
  thirdLabel,
  fourthLabel,
  fifthLabel,
  sixthLabel,
  tenantDetails = [],
}: any) => (
  <>
    <View>
      <View style={styles.mainSection}>
        <View style={styles.section}>
          <View style={styles.tenantTitle}>
            <View style={styles.rowWrapper}>
              <View style={styles.headerWrapperStyles}>
                <Text style={styles.headerStyles}>{tenantHeader}</Text>
              </View>
            </View>
            <View style={styles.labelStyles}>
              <Text>{firstLabel}</Text>
            </View>
            <View style={styles.labelStyles}>
              <Text style={styles.label}>{secondLabel}</Text>
            </View>
            <View style={styles.labelStyles}>
              <Text>{thirdLabel}</Text>
            </View>
            <View style={styles.labelStyles}>
              <Text>{fourthLabel}</Text>
            </View>
            <View style={styles.labelStyles}>
              <Text style={styles.label}>{fifthLabel}</Text>
            </View>
            <View style={styles.labelStyles}>
              <Text style={styles.label}>{sixthLabel}</Text>
            </View>
          </View>
          <View style={styles.tenantItems}>
            {!!tenantDetails && tenantDetails.length
              ? tenantDetails?.map((each: any, ind: number) => (
                  <View key={ind} style={styles.optionStyles}>
                    <View style={styles.numbersStyles}>
                      <Text style={styles.isBold}>{each?.adultNumber}</Text>
                    </View>
                    <View style={styles.labelStyles}>
                      <View>
                        <Text style={[styles.label, styles.isBold]}>
                          {each?.adultFirstName + ' ' + each?.adultLastName}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.labelStyles}>
                      <Text style={[styles.label, styles.isBold]}>{each?.dateOfBirth}</Text>
                    </View>
                    <View style={styles.labelStyles}>
                      <Text style={[styles.label, styles.isBold]}>{each?.citizenship}</Text>
                    </View>
                    <View style={styles.labelStyles}>
                      <Text style={[styles.label, styles.isBold]}>{each?.currentAddress}</Text>
                    </View>
                    <View style={styles.labelStyles}>
                      <Text style={[styles.label, styles.isBold]}>{each?.email}</Text>
                    </View>
                    <View style={styles.labelStyles}>
                      <Text style={[styles.label, styles.isBold]}>{each?.phone}</Text>
                    </View>
                  </View>
                ))
              : null}
          </View>
        </View>
      </View>
    </View>
  </>
);

export default TenantProfile;
