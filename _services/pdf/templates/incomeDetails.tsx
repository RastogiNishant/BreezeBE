import { StyleSheet, View, Text, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  wrapper: {
    // flexDirection: 'row',
  },
  header: {
    marginTop: '8px',
    height: 19,
    backgroundColor: '#F6FCFC',
    color: '#00ACD4',
    borderRadius: '5px',
    paddingLeft: '7px',
    fontSize: '10px',
    paddingTop: '3px',
    fontFamily: 'Montserrat',
    fontWeight: 700,
    width: '33%',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '4px',
  },
  leftSection: {
    flex: '0 0 33%',
  },
  rightSection: {
    flexDirection: 'row',
    flex: '0 0 67%',
    marginLeft: '7.5px',
  },
  upperCase: {
    textTransform: 'uppercase',
  },
  isBold: {
    fontWeight: 700,
  },
  isUnderline: {
    textDecoration: 'underline',
  },
  icon: {
    maxWidth: 20,
    margin: 'auto',
    padding: 0,
  },
  margin: {
    marginLeft: 10,
  },
  top: {
    width: 100,
    height: '15px',
    backgroundColor: '#F6FCFC',
    borderRadius: '3px',
  },
  rowWrapper: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    marginRight: '7.5px',
    // maxWidth: 170,
  },
  textWrapper: {
    backgroundColor: '#F6FCFC',
    borderRadius: '5px',
    marginBottom: '4px',
    height: 15,
    fontWeight: 'light',
    color: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    marginLeft: '7px',
    fontSize: '7px',
    marginTop: '1px',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: '6px',
    fontStyle: 'italic',
  },
  pageIcon: {
    width: '8px',
    marginRight: '7px',
    marginLeft: '4px',
  },
});

const IncomeDetails = ({
  incomeHeader,
  monthlyIncome,
  incomeSource,
  currentJob,
  jobDuration,
  companyDetails,
  incomeDetails = [],
  page,
}: any) => (
  <>
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.upperCase}>{incomeHeader}</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.leftSection}>
          <View style={styles.rowWrapper}>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{monthlyIncome}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{incomeSource}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{currentJob}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{jobDuration}</Text>
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.rowText}>{companyDetails}</Text>
            </View>
          </View>
        </View>
        <View style={styles.rightSection}>
          {!!incomeDetails && incomeDetails.length
            ? incomeDetails?.map((each: any, ind: number) => {
              return (
                <View style={styles.rowWrapper} key={ind}>
                  <View style={[styles.textWrapper, styles.iconContainer]}>
                    <Text style={[styles.rowText, styles.isBold, styles.isUnderline]}>
                      {each?.monthlyIncome}
                    </Text>

                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={[styles.rowText, styles.isBold]}>{each?.incomeSource}</Text>
                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={[styles.rowText, styles.isBold]}>{each?.currentJob}</Text>
                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={[styles.rowText, styles.isBold]}>{each?.jobDuration}</Text>
                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={[styles.rowText, styles.isBold]}>{each?.companyDetails}</Text>
                  </View>
                </View>
              );
            })
            : null}
        </View>
      </View>
    </View>
  </>
);

export default IncomeDetails;
